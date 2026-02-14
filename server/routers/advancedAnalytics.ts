import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  users, forumThreads, forumPosts, courseEnrollments, courses,
  communityEvents, eventRegistrations, challenges, userChallenges,
  userSubscriptions, membershipTiers, paymentHistory, referrals,
  aiCorrections, channelMemberships, channels,
} from "../../drizzle/schema";
import { eq, desc, and, sql, gte, lte, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const advancedAnalyticsRouter = router({
  // Revenue dashboard
  revenueDashboard: protectedProcedure.input(z.object({
    days: z.number().min(7).max(365).default(30),
  }).optional()).query(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return null;

    const days = input?.days ?? 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Total revenue
    const [totalRev] = await db.select({
      total: sql<string>`COALESCE(SUM(${paymentHistory.amount}), 0)`,
      count: sql<number>`COUNT(*)`,
    }).from(paymentHistory)
      .where(and(
        eq(paymentHistory.status, "succeeded"),
        gte(paymentHistory.createdAt, since),
      ));

    // MRR calculation
    const [mrrResult] = await db.select({
      mrr: sql<string>`COALESCE(SUM(CASE WHEN ${userSubscriptions.billingCycle} = 'monthly' THEN ${membershipTiers.priceMonthly} ELSE ${membershipTiers.priceYearly} / 12 END), 0)`,
    }).from(userSubscriptions)
      .innerJoin(membershipTiers, eq(userSubscriptions.tierId, membershipTiers.id))
      .where(eq(userSubscriptions.status, "active"));

    // Subscription breakdown by tier
    const tierBreakdown = await db.select({
      tierName: membershipTiers.name,
      tierSlug: membershipTiers.slug,
      activeCount: sql<number>`COUNT(*)`,
      revenue: sql<string>`COALESCE(SUM(CASE WHEN ${userSubscriptions.billingCycle} = 'monthly' THEN ${membershipTiers.priceMonthly} ELSE ${membershipTiers.priceYearly} / 12 END), 0)`,
    }).from(userSubscriptions)
      .innerJoin(membershipTiers, eq(userSubscriptions.tierId, membershipTiers.id))
      .where(eq(userSubscriptions.status, "active"))
      .groupBy(membershipTiers.name, membershipTiers.slug);

    // Churn rate (canceled in period / active at start)
    const [churnData] = await db.select({
      canceled: sql<number>`COUNT(CASE WHEN ${userSubscriptions.canceledAt} >= ${since} THEN 1 END)`,
      total: sql<number>`COUNT(*)`,
    }).from(userSubscriptions);

    return {
      totalRevenue: parseFloat(totalRev?.total ?? "0"),
      transactionCount: totalRev?.count ?? 0,
      mrr: parseFloat(mrrResult?.mrr ?? "0"),
      arr: parseFloat(mrrResult?.mrr ?? "0") * 12,
      tierBreakdown,
      churnRate: (churnData?.total ?? 0) > 0
        ? Math.round(((churnData?.canceled ?? 0) / (churnData?.total ?? 1)) * 100)
        : 0,
      period: { days, since: since.toISOString() },
    };
  }),

  // User engagement metrics
  engagementMetrics: protectedProcedure.input(z.object({
    days: z.number().min(7).max(365).default(30),
  }).optional()).query(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return null;

    const days = input?.days ?? 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Active users
    const [activeUsers] = await db.select({
      count: sql<number>`COUNT(DISTINCT ${users.id})`,
    }).from(users)
      .where(gte(users.lastSignedIn, since));

    // New users
    const [newUsers] = await db.select({
      count: sql<number>`COUNT(*)`,
    }).from(users)
      .where(gte(users.createdAt, since));

    // Posts created
    const [postsCreated] = await db.select({
      count: sql<number>`COUNT(*)`,
    }).from(forumThreads)
      .where(gte(forumThreads.createdAt, since));

    // Comments created
    const [commentsCreated] = await db.select({
      count: sql<number>`COUNT(*)`,
    }).from(forumPosts)
      .where(gte(forumPosts.createdAt, since));

    // Course enrollments
    const [enrollments] = await db.select({
      count: sql<number>`COUNT(*)`,
    }).from(courseEnrollments)
      .where(gte(courseEnrollments.enrolledAt, since));

    // Event registrations
    const [eventRegs] = await db.select({
      count: sql<number>`COUNT(*)`,
    }).from(eventRegistrations)
      .where(gte(eventRegistrations.registeredAt, since));

    // AI corrections
    const [aiUsage] = await db.select({
      count: sql<number>`COUNT(*)`,
    }).from(aiCorrections)
      .where(gte(aiCorrections.createdAt, since));

    // Total users
    const [totalUsers] = await db.select({
      count: sql<number>`COUNT(*)`,
    }).from(users);

    return {
      activeUsers: activeUsers?.count ?? 0,
      newUsers: newUsers?.count ?? 0,
      totalUsers: totalUsers?.count ?? 0,
      postsCreated: postsCreated?.count ?? 0,
      commentsCreated: commentsCreated?.count ?? 0,
      courseEnrollments: enrollments?.count ?? 0,
      eventRegistrations: eventRegs?.count ?? 0,
      aiCorrections: aiUsage?.count ?? 0,
      retentionRate: (totalUsers?.count ?? 0) > 0
        ? Math.round(((activeUsers?.count ?? 0) / (totalUsers?.count ?? 1)) * 100)
        : 0,
      period: { days, since: since.toISOString() },
    };
  }),

  // Content performance
  contentPerformance: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return null;

    // Top courses by enrollment
    const topCourses = await db.select({
      id: courses.id,
      title: courses.title,
      enrollments: courses.totalEnrollments,
      rating: courses.averageRating,
    }).from(courses)
      .where(sql`${courses.publishedAt} IS NOT NULL`)
      .orderBy(desc(courses.totalEnrollments))
      .limit(10);

    // Top threads by engagement
    const topThreads = await db.select({
      id: forumThreads.id,
      title: forumThreads.title,
      views: forumThreads.viewCount,
      likes: forumThreads.likeCount,
      replies: forumThreads.replyCount,
    }).from(forumThreads)
      .orderBy(desc(forumThreads.viewCount))
      .limit(10);

    // Channel stats
    const channelStats = await db.select({
      id: channels.id,
      name: channels.name,
      memberCount: channels.memberCount,
      threadCount: channels.threadCount,
    }).from(channels)
      .where(eq(channels.isActive, true))
      .orderBy(desc(channels.memberCount))
      .limit(10);

    return { topCourses, topThreads, channelStats };
  }),

  // Referral analytics
  referralAnalytics: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return null;

    const [stats] = await db.select({
      totalReferrals: sql<number>`COUNT(CASE WHEN ${referrals.referredUserId} IS NOT NULL THEN 1 END)`,
      totalConversions: sql<number>`COUNT(CASE WHEN ${referrals.status} = 'converted' THEN 1 END)`,
      totalClicks: sql<number>`COALESCE(SUM(${referrals.clickCount}), 0)`,
      totalCommissions: sql<string>`COALESCE(SUM(${referrals.commissionAmount}), 0)`,
    }).from(referrals);

    const conversionRate = (stats?.totalReferrals ?? 0) > 0
      ? Math.round(((stats?.totalConversions ?? 0) / (stats?.totalReferrals ?? 1)) * 100)
      : 0;

    return {
      totalReferrals: stats?.totalReferrals ?? 0,
      totalConversions: stats?.totalConversions ?? 0,
      totalClicks: stats?.totalClicks ?? 0,
      totalCommissions: parseFloat(String(stats?.totalCommissions ?? "0")),
      conversionRate,
    };
  }),
});
