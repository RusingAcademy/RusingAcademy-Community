import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { membershipTiers, userSubscriptions, paymentHistory, users } from "../../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getStripe } from "../stripe/client";
import { STRIPE_SUCCESS_PATH, STRIPE_CANCEL_PATH } from "../stripe/products";

export const membershipRouter = router({
  // List all active membership tiers
  listTiers: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const tiers = await db.select().from(membershipTiers)
      .where(eq(membershipTiers.isActive, true))
      .orderBy(membershipTiers.sortOrder);
    return tiers;
  }),

  // Get a specific tier by slug
  getTier: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const [tier] = await db.select().from(membershipTiers)
      .where(eq(membershipTiers.slug, input.slug)).limit(1);
    return tier ?? null;
  }),

  // Get current user's subscription
  mySubscription: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const [sub] = await db.select({
      subscription: userSubscriptions,
      tier: membershipTiers,
    }).from(userSubscriptions)
      .innerJoin(membershipTiers, eq(userSubscriptions.tierId, membershipTiers.id))
      .where(and(
        eq(userSubscriptions.userId, ctx.user.id),
        eq(userSubscriptions.status, "active"),
      ))
      .limit(1);
    return sub ?? null;
  }),

  // Create Stripe Checkout Session for subscription
  createCheckoutSession: protectedProcedure.input(z.object({
    tierId: z.number(),
    billingCycle: z.enum(["monthly", "yearly"]),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Get the tier
    const [tier] = await db.select().from(membershipTiers)
      .where(eq(membershipTiers.id, input.tierId)).limit(1);
    if (!tier) throw new TRPCError({ code: "NOT_FOUND", message: "Tier not found" });

    // Free tier doesn't need Stripe
    if (tier.slug === "free") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Free tier does not require payment" });
    }

    const stripe = getStripe();
    const origin = ctx.req.headers.origin || ctx.req.headers.referer?.replace(/\/$/, "") || "http://localhost:3000";

    // Determine price: use Stripe Price ID if available, otherwise create a price on the fly
    let priceId: string | undefined;
    if (input.billingCycle === "monthly" && tier.stripePriceIdMonthly) {
      priceId = tier.stripePriceIdMonthly;
    } else if (input.billingCycle === "yearly" && tier.stripePriceIdYearly) {
      priceId = tier.stripePriceIdYearly;
    }

    // Build line items
    let lineItems: any[];
    if (priceId) {
      lineItems = [{ price: priceId, quantity: 1 }];
    } else {
      // Create inline price data
      const amount = input.billingCycle === "monthly"
        ? Math.round(parseFloat(tier.priceMonthly ?? "0") * 100)
        : Math.round(parseFloat(tier.priceYearly ?? "0") * 100);

      lineItems = [{
        price_data: {
          currency: (tier.currency ?? "cad").toLowerCase(),
          product_data: {
            name: `${tier.name} Membership (${input.billingCycle})`,
            description: tier.description ?? `RusingAcademy ${tier.name} Plan`,
          },
          unit_amount: amount,
          recurring: {
            interval: input.billingCycle === "monthly" ? "month" as const : "year" as const,
          },
        },
        quantity: 1,
      }];
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: lineItems,
      customer_email: ctx.user.email ?? undefined,
      client_reference_id: ctx.user.id.toString(),
      metadata: {
        user_id: ctx.user.id.toString(),
        tier_id: input.tierId.toString(),
        billing_cycle: input.billingCycle,
        customer_email: ctx.user.email ?? "",
        customer_name: ctx.user.name ?? "",
      },
      success_url: `${origin}${STRIPE_SUCCESS_PATH}`,
      cancel_url: `${origin}${STRIPE_CANCEL_PATH}`,
      allow_promotion_codes: true,
    });

    return { checkoutUrl: session.url };
  }),

  // Create Stripe Customer Portal session for managing subscription
  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Find user's active subscription with Stripe customer ID
    const [sub] = await db.select().from(userSubscriptions)
      .where(and(
        eq(userSubscriptions.userId, ctx.user.id),
        eq(userSubscriptions.status, "active"),
      )).limit(1);

    if (!sub?.stripeCustomerId) {
      throw new TRPCError({ code: "NOT_FOUND", message: "No active Stripe subscription found" });
    }

    const stripe = getStripe();
    const origin = ctx.req.headers.origin || ctx.req.headers.referer?.replace(/\/$/, "") || "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${origin}/membership`,
    });

    return { portalUrl: portalSession.url };
  }),

  // Cancel subscription (sets cancel_at_period_end via Stripe)
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [sub] = await db.select().from(userSubscriptions)
      .where(and(
        eq(userSubscriptions.userId, ctx.user.id),
        eq(userSubscriptions.status, "active"),
      )).limit(1);

    if (!sub) throw new TRPCError({ code: "NOT_FOUND", message: "No active subscription" });

    // If we have a Stripe subscription, cancel via Stripe
    if (sub.stripeSubscriptionId) {
      const stripe = getStripe();
      await stripe.subscriptions.update(sub.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }

    // Update local record
    await db.update(userSubscriptions)
      .set({
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
      })
      .where(eq(userSubscriptions.id, sub.id));

    return { success: true };
  }),

  // Payment history
  myPayments: protectedProcedure.input(z.object({
    limit: z.number().min(1).max(50).default(20),
  }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const limit = input?.limit ?? 20;
    return db.select().from(paymentHistory)
      .where(eq(paymentHistory.userId, ctx.user.id))
      .orderBy(desc(paymentHistory.createdAt))
      .limit(limit);
  }),

  // Admin: create/update tier
  upsertTier: protectedProcedure.input(z.object({
    id: z.number().optional(),
    name: z.string().min(1),
    nameFr: z.string().optional(),
    slug: z.string().min(1),
    description: z.string().optional(),
    descriptionFr: z.string().optional(),
    priceMonthly: z.string().default("0.00"),
    priceYearly: z.string().default("0.00"),
    features: z.array(z.string()).optional(),
    featuresFr: z.array(z.string()).optional(),
    maxCourses: z.number().default(-1),
    maxDMs: z.number().default(5),
    canAccessPremiumContent: z.boolean().default(false),
    canCreateEvents: z.boolean().default(false),
    canAccessAnalytics: z.boolean().default(false),
    badgeLabel: z.string().optional(),
    badgeColor: z.string().optional(),
    sortOrder: z.number().default(0),
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    if (input.id) {
      await db.update(membershipTiers).set({
        name: input.name,
        nameFr: input.nameFr,
        slug: input.slug,
        description: input.description,
        descriptionFr: input.descriptionFr,
        priceMonthly: input.priceMonthly,
        priceYearly: input.priceYearly,
        features: input.features,
        featuresFr: input.featuresFr,
        maxCourses: input.maxCourses,
        maxDMs: input.maxDMs,
        canAccessPremiumContent: input.canAccessPremiumContent,
        canCreateEvents: input.canCreateEvents,
        canAccessAnalytics: input.canAccessAnalytics,
        badgeLabel: input.badgeLabel,
        badgeColor: input.badgeColor,
        sortOrder: input.sortOrder,
      }).where(eq(membershipTiers.id, input.id));
      return { id: input.id };
    }

    const result = await db.insert(membershipTiers).values({
      name: input.name,
      nameFr: input.nameFr,
      slug: input.slug,
      description: input.description,
      descriptionFr: input.descriptionFr,
      priceMonthly: input.priceMonthly,
      priceYearly: input.priceYearly,
      features: input.features,
      featuresFr: input.featuresFr,
      maxCourses: input.maxCourses,
      maxDMs: input.maxDMs,
      canAccessPremiumContent: input.canAccessPremiumContent,
      canCreateEvents: input.canCreateEvents,
      canAccessAnalytics: input.canAccessAnalytics,
      badgeLabel: input.badgeLabel,
      badgeColor: input.badgeColor,
      sortOrder: input.sortOrder,
    });
    return { id: Number(result[0].insertId) };
  }),

  // Sync Stripe products/prices for a tier (admin)
  syncStripeProducts: protectedProcedure.input(z.object({
    tierId: z.number(),
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [tier] = await db.select().from(membershipTiers)
      .where(eq(membershipTiers.id, input.tierId)).limit(1);
    if (!tier) throw new TRPCError({ code: "NOT_FOUND" });
    if (tier.slug === "free") return { synced: false, reason: "Free tier does not need Stripe" };

    const stripe = getStripe();

    // Create or update Stripe product
    let productId = tier.stripeProductId;
    if (!productId) {
      const product = await stripe.products.create({
        name: `RusingAcademy ${tier.name} Membership`,
        description: tier.description ?? undefined,
        metadata: { tier_id: tier.id.toString(), tier_slug: tier.slug },
      });
      productId = product.id;
    }

    // Create monthly price
    const monthlyAmount = Math.round(parseFloat(tier.priceMonthly ?? "0") * 100);
    let monthlyPriceId = tier.stripePriceIdMonthly;
    if (!monthlyPriceId && monthlyAmount > 0) {
      const price = await stripe.prices.create({
        product: productId,
        unit_amount: monthlyAmount,
        currency: (tier.currency ?? "cad").toLowerCase(),
        recurring: { interval: "month" },
        metadata: { tier_id: tier.id.toString(), billing_cycle: "monthly" },
      });
      monthlyPriceId = price.id;
    }

    // Create yearly price
    const yearlyAmount = Math.round(parseFloat(tier.priceYearly ?? "0") * 100);
    let yearlyPriceId = tier.stripePriceIdYearly;
    if (!yearlyPriceId && yearlyAmount > 0) {
      const price = await stripe.prices.create({
        product: productId,
        unit_amount: yearlyAmount,
        currency: (tier.currency ?? "cad").toLowerCase(),
        recurring: { interval: "year" },
        metadata: { tier_id: tier.id.toString(), billing_cycle: "yearly" },
      });
      yearlyPriceId = price.id;
    }

    // Update DB with Stripe IDs
    await db.update(membershipTiers).set({
      stripeProductId: productId,
      stripePriceIdMonthly: monthlyPriceId,
      stripePriceIdYearly: yearlyPriceId,
    }).where(eq(membershipTiers.id, tier.id));

    return { synced: true, productId, monthlyPriceId, yearlyPriceId };
  }),

  // Admin: revenue overview
  revenueOverview: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return { totalRevenue: 0, activeSubscriptions: 0, mrr: 0, tierBreakdown: [] };

    const [revResult] = await db.select({
      total: sql<string>`COALESCE(SUM(${paymentHistory.amount}), 0)`,
    }).from(paymentHistory)
      .where(eq(paymentHistory.status, "succeeded"));

    const [subCount] = await db.select({
      count: sql<number>`COUNT(*)`,
    }).from(userSubscriptions)
      .where(eq(userSubscriptions.status, "active"));

    const tierBreakdown = await db.select({
      tierName: membershipTiers.name,
      count: sql<number>`COUNT(${userSubscriptions.id})`,
      revenue: sql<string>`COALESCE(SUM(CASE WHEN ${userSubscriptions.billingCycle} = 'monthly' THEN ${membershipTiers.priceMonthly} ELSE ${membershipTiers.priceYearly} / 12 END), 0)`,
    }).from(userSubscriptions)
      .innerJoin(membershipTiers, eq(userSubscriptions.tierId, membershipTiers.id))
      .where(eq(userSubscriptions.status, "active"))
      .groupBy(membershipTiers.name);

    return {
      totalRevenue: parseFloat(revResult?.total ?? "0"),
      activeSubscriptions: subCount?.count ?? 0,
      mrr: tierBreakdown.reduce((sum, t) => sum + parseFloat(String(t.revenue ?? "0")), 0),
      tierBreakdown,
    };
  }),
});
