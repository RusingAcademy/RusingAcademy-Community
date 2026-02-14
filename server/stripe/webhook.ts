import { Router, raw } from "express";
import type { Request, Response } from "express";
import Stripe from "stripe";
import { getStripe } from "./client";
import { getDb } from "../db";
import { users, userSubscriptions, paymentHistory, membershipTiers } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const stripeWebhookRouter = Router();

// MUST use raw body for Stripe signature verification
stripeWebhookRouter.post(
  "/",
  raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const stripe = getStripe();
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      console.error("[Stripe Webhook] Missing signature or webhook secret");
      return res.status(400).json({ error: "Missing signature or secret" });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error("[Stripe Webhook] Signature verification failed:", err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Handle test events
    if (event.id.startsWith("evt_test_")) {
      console.log("[Stripe Webhook] Test event detected, returning verification response");
      return res.json({ verified: true });
    }

    console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          await handleCheckoutCompleted(session);
          break;
        }
        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionUpdated(subscription);
          break;
        }
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionDeleted(subscription);
          break;
        }
        case "invoice.paid": {
          const invoice = event.data.object;
          await handleInvoicePaid(invoice);
          break;
        }
        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }
    } catch (err: any) {
      console.error(`[Stripe Webhook] Error processing ${event.type}:`, err.message);
      // Return 200 to prevent retries for processing errors
    }

    return res.json({ received: true });
  }
);

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const db = await getDb();
  if (!db) return;

  const userId = session.metadata?.user_id ? parseInt(session.metadata.user_id) : null;
  const tierId = session.metadata?.tier_id ? parseInt(session.metadata.tier_id) : null;
  const billingCycle = (session.metadata?.billing_cycle as "monthly" | "yearly") ?? "monthly";

  if (!userId || !tierId) {
    console.error("[Stripe Webhook] Missing user_id or tier_id in session metadata");
    return;
  }

  const stripeCustomerId = typeof session.customer === "string" ? session.customer : (session.customer as any)?.id ?? null;
  const stripeSubscriptionId = typeof session.subscription === "string" ? session.subscription : (session.subscription as any)?.id ?? null;

  // Cancel any existing active subscription for this user
  await db.update(userSubscriptions)
    .set({ status: "canceled", canceledAt: new Date() })
    .where(and(
      eq(userSubscriptions.userId, userId),
      eq(userSubscriptions.status, "active"),
    ));

  // Create new subscription record
  const now = new Date();
  const periodEnd = new Date(now);
  if (billingCycle === "monthly") {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }

  await db.insert(userSubscriptions).values({
    userId,
    tierId,
    stripeCustomerId: stripeCustomerId ?? undefined,
    stripeSubscriptionId: stripeSubscriptionId ?? undefined,
    status: "active",
    billingCycle,
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
  });

  console.log(`[Stripe Webhook] Subscription created for user ${userId}, tier ${tierId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const db = await getDb();
  if (!db) return;

  const stripeSubId = subscription.id;
  const status = subscription.status;

  // Map Stripe status to our status enum
  const statusMap: Record<string, string> = {
    active: "active",
    past_due: "past_due",
    canceled: "canceled",
    trialing: "trialing",
    paused: "paused",
    incomplete: "incomplete",
    incomplete_expired: "canceled",
    unpaid: "past_due",
  };

  const mappedStatus = statusMap[status] ?? "active";

  // Use type assertion to access period fields which may vary by Stripe API version
  const subAny = subscription as any;

  await db.update(userSubscriptions)
    .set({
      status: mappedStatus as any,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodStart: subAny.current_period_start
        ? new Date(subAny.current_period_start * 1000)
        : undefined,
      currentPeriodEnd: subAny.current_period_end
        ? new Date(subAny.current_period_end * 1000)
        : undefined,
    })
    .where(eq(userSubscriptions.stripeSubscriptionId, stripeSubId));

  console.log(`[Stripe Webhook] Subscription ${stripeSubId} updated to ${mappedStatus}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const db = await getDb();
  if (!db) return;

  await db.update(userSubscriptions)
    .set({ status: "canceled", canceledAt: new Date() })
    .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id));

  console.log(`[Stripe Webhook] Subscription ${subscription.id} canceled`);
}

async function handleInvoicePaid(invoice: any) {
  const db = await getDb();
  if (!db) return;

  const stripeSubId = typeof invoice.subscription === "string"
    ? invoice.subscription
    : invoice.subscription?.id ?? null;
  if (!stripeSubId) return;

  // Find the subscription to get the userId
  const [sub] = await db.select().from(userSubscriptions)
    .where(eq(userSubscriptions.stripeSubscriptionId, stripeSubId))
    .limit(1);

  if (!sub) return;

  const paymentIntentId = typeof invoice.payment_intent === "string"
    ? invoice.payment_intent
    : invoice.payment_intent?.id ?? undefined;

  // Record payment
  await db.insert(paymentHistory).values({
    userId: sub.userId,
    subscriptionId: sub.id,
    stripePaymentIntentId: paymentIntentId,
    stripeInvoiceId: invoice.id,
    amount: ((invoice.amount_paid ?? 0) / 100).toFixed(2),
    currency: invoice.currency?.toUpperCase() ?? "CAD",
    status: "succeeded",
    description: `Invoice ${invoice.number ?? invoice.id}`,
  });

  console.log(`[Stripe Webhook] Payment recorded for subscription ${stripeSubId}`);
}
