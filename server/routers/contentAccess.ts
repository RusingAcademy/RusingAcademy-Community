import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { contentAccessRules, membershipTiers, userSubscriptions } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const contentAccessRouter = router({
  // Check if user can access content
  checkAccess: protectedProcedure.input(z.object({
    contentType: z.enum(["course", "lesson", "event", "category", "challenge"]),
    contentId: z.number(),
  })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return { hasAccess: true, reason: "no_db" };

    // Admin always has access
    if (ctx.user.role === "admin") return { hasAccess: true, reason: "admin" };

    // Check if there's an access rule for this content
    const [rule] = await db.select().from(contentAccessRules)
      .where(and(
        eq(contentAccessRules.contentType, input.contentType),
        eq(contentAccessRules.contentId, input.contentId),
        eq(contentAccessRules.isActive, true),
      )).limit(1);

    // No rule = free access
    if (!rule) return { hasAccess: true, reason: "free" };

    // Check user's subscription
    const [sub] = await db.select({
      subscription: userSubscriptions,
      tier: membershipTiers,
    }).from(userSubscriptions)
      .innerJoin(membershipTiers, eq(userSubscriptions.tierId, membershipTiers.id))
      .where(and(
        eq(userSubscriptions.userId, ctx.user.id),
        eq(userSubscriptions.status, "active"),
      )).limit(1);

    if (!sub) {
      // Get required tier info
      const [requiredTier] = rule.requiredTierId
        ? await db.select().from(membershipTiers).where(eq(membershipTiers.id, rule.requiredTierId)).limit(1)
        : [null];

      return {
        hasAccess: false,
        reason: "no_subscription",
        requiredTier: requiredTier ? { name: requiredTier.name, slug: requiredTier.slug, priceMonthly: requiredTier.priceMonthly } : null,
      };
    }

    // Check if user's tier meets the requirement
    if (rule.requiredTierId && (sub.tier.sortOrder ?? 0) < (rule.requiredTierId ?? 0)) {
      const [requiredTier] = await db.select().from(membershipTiers)
        .where(eq(membershipTiers.id, rule.requiredTierId)).limit(1);

      return {
        hasAccess: false,
        reason: "insufficient_tier",
        currentTier: sub.tier.name,
        requiredTier: requiredTier ? { name: requiredTier.name, slug: requiredTier.slug, priceMonthly: requiredTier.priceMonthly } : null,
      };
    }

    return { hasAccess: true, reason: "subscribed" };
  }),

  // Admin: set access rule
  setRule: protectedProcedure.input(z.object({
    contentType: z.enum(["course", "lesson", "event", "category", "challenge"]),
    contentId: z.number(),
    requiredTierId: z.number().nullable(),
    dripDelayDays: z.number().default(0),
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Check if rule already exists
    const [existing] = await db.select().from(contentAccessRules)
      .where(and(
        eq(contentAccessRules.contentType, input.contentType),
        eq(contentAccessRules.contentId, input.contentId),
      )).limit(1);

    if (existing) {
      if (input.requiredTierId === null) {
        // Remove the rule (make content free)
        await db.delete(contentAccessRules).where(eq(contentAccessRules.id, existing.id));
        return { action: "removed" };
      }
      await db.update(contentAccessRules).set({
        requiredTierId: input.requiredTierId,
        dripDelayDays: input.dripDelayDays,
      }).where(eq(contentAccessRules.id, existing.id));
      return { action: "updated", id: existing.id };
    }

    if (input.requiredTierId === null) return { action: "no_change" };

    const result = await db.insert(contentAccessRules).values({
      contentType: input.contentType,
      contentId: input.contentId,
      requiredTierId: input.requiredTierId,
      dripDelayDays: input.dripDelayDays,
    });

    return { action: "created", id: Number(result[0].insertId) };
  }),

  // Admin: list all access rules
  listRules: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return [];

    return db.select({
      rule: contentAccessRules,
      tier: {
        id: membershipTiers.id,
        name: membershipTiers.name,
        slug: membershipTiers.slug,
      },
    }).from(contentAccessRules)
      .leftJoin(membershipTiers, eq(contentAccessRules.requiredTierId, membershipTiers.id))
      .where(eq(contentAccessRules.isActive, true));
  }),
});
