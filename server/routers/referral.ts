import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { referrals, users, userSubscriptions, membershipTiers } from "../../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "RA-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const referralRouter = router({
  // Get or create my referral code
  myReferralCode: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    // Find existing referral code for this user
    const [existing] = await db.select().from(referrals)
      .where(and(
        eq(referrals.referrerId, ctx.user.id),
        eq(referrals.status, "pending"),
      ))
      .limit(1);

    if (existing) return existing;

    // Create a new referral code
    const code = generateReferralCode();
    const result = await db.insert(referrals).values({
      referrerId: ctx.user.id,
      referralCode: code,
      status: "pending",
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    });

    return {
      id: Number(result[0].insertId),
      referralCode: code,
      referrerId: ctx.user.id,
      clickCount: 0,
      status: "pending" as const,
    };
  }),

  // Track a referral click
  trackClick: publicProcedure.input(z.object({ code: z.string() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };

    await db.update(referrals)
      .set({ clickCount: sql`${referrals.clickCount} + 1` })
      .where(eq(referrals.referralCode, input.code));

    return { success: true };
  }),

  // Register a referred user
  registerReferral: protectedProcedure.input(z.object({ code: z.string() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [ref] = await db.select().from(referrals)
      .where(eq(referrals.referralCode, input.code)).limit(1);

    if (!ref) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid referral code" });
    if (ref.referrerId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot use own referral code" });

    await db.update(referrals).set({
      referredUserId: ctx.user.id,
      status: "signed_up",
    }).where(eq(referrals.id, ref.id));

    return { success: true };
  }),

  // My referral stats
  myReferralStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { totalReferrals: 0, conversions: 0, totalClicks: 0, totalCommission: 0, pendingCommission: 0 };

    const allRefs = await db.select().from(referrals)
      .where(eq(referrals.referrerId, ctx.user.id));

    const totalReferrals = allRefs.filter(r => r.referredUserId !== null).length;
    const conversions = allRefs.filter(r => r.status === "converted").length;
    const totalClicks = allRefs.reduce((sum, r) => sum + (r.clickCount ?? 0), 0);
    const totalCommission = allRefs.reduce((sum, r) => sum + parseFloat(String(r.commissionAmount ?? "0")), 0);
    const pendingCommission = allRefs.filter(r => !r.commissionPaid).reduce((sum, r) => sum + parseFloat(String(r.commissionAmount ?? "0")), 0);

    return { totalReferrals, conversions, totalClicks, totalCommission, pendingCommission };
  }),

  // List my referrals
  myReferrals: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db.select({
      referral: referrals,
      referredUser: {
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
      },
    }).from(referrals)
      .leftJoin(users, eq(referrals.referredUserId, users.id))
      .where(eq(referrals.referrerId, ctx.user.id))
      .orderBy(desc(referrals.createdAt));
  }),

  // Admin: all referral stats
  adminReferralStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return { totalReferrals: 0, totalConversions: 0, totalCommissions: 0, topReferrers: [] };

    const [stats] = await db.select({
      totalReferrals: sql<number>`COUNT(CASE WHEN ${referrals.referredUserId} IS NOT NULL THEN 1 END)`,
      totalConversions: sql<number>`COUNT(CASE WHEN ${referrals.status} = 'converted' THEN 1 END)`,
      totalCommissions: sql<string>`COALESCE(SUM(${referrals.commissionAmount}), 0)`,
    }).from(referrals);

    const topReferrers = await db.select({
      userId: users.id,
      userName: users.name,
      referralCount: sql<number>`COUNT(${referrals.id})`,
      commissionTotal: sql<string>`COALESCE(SUM(${referrals.commissionAmount}), 0)`,
    }).from(referrals)
      .innerJoin(users, eq(referrals.referrerId, users.id))
      .where(sql`${referrals.referredUserId} IS NOT NULL`)
      .groupBy(users.id, users.name)
      .orderBy(sql`COUNT(${referrals.id}) DESC`)
      .limit(10);

    return {
      totalReferrals: stats?.totalReferrals ?? 0,
      totalConversions: stats?.totalConversions ?? 0,
      totalCommissions: parseFloat(String(stats?.totalCommissions ?? "0")),
      topReferrers,
    };
  }),
});
