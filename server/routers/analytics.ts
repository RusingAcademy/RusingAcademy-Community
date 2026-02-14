import { eq, and, desc, sql, gte } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import {
  users,
  forumThreads,
  forumPosts,
  courseEnrollments,
  communityEvents,
  eventRegistrations,
  challenges,
  userChallenges,
  xpTransactions,
  learnerXp,
} from "../../drizzle/schema";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const analyticsRouter = router({
  // Overview stats
  overview: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db)
      return {
        totalMembers: 0,
        totalPosts: 0,
        totalComments: 0,
        totalEnrollments: 0,
        newMembersThisWeek: 0,
        postsThisWeek: 0,
      };

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalMembers] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    const [totalPosts] = await db
      .select({ count: sql<number>`count(*)` })
      .from(forumThreads)
      .where(eq(forumThreads.status, "active"));

    const [totalComments] = await db
      .select({ count: sql<number>`count(*)` })
      .from(forumPosts)
      .where(eq(forumPosts.status, "active"));

    const [totalEnrollments] = await db
      .select({ count: sql<number>`count(*)` })
      .from(courseEnrollments);

    const [newMembersThisWeek] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(gte(users.createdAt, weekAgo));

    const [postsThisWeek] = await db
      .select({ count: sql<number>`count(*)` })
      .from(forumThreads)
      .where(
        and(eq(forumThreads.status, "active"), gte(forumThreads.createdAt, weekAgo))
      );

    return {
      totalMembers: Number(totalMembers?.count ?? 0),
      totalPosts: Number(totalPosts?.count ?? 0),
      totalComments: Number(totalComments?.count ?? 0),
      totalEnrollments: Number(totalEnrollments?.count ?? 0),
      newMembersThisWeek: Number(newMembersThisWeek?.count ?? 0),
      postsThisWeek: Number(postsThisWeek?.count ?? 0),
    };
  }),

  // Top contributors by XP
  topContributors: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const top = await db
      .select({
        userId: learnerXp.userId,
        totalXp: learnerXp.totalXp,
      })
      .from(learnerXp)
      .orderBy(desc(learnerXp.totalXp))
      .limit(10);

    const enriched = await Promise.all(
      top.map(async (entry) => {
        const [user] = await db
          .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
          .from(users)
          .where(eq(users.id, entry.userId))
          .limit(1);
        return { ...entry, user };
      })
    );

    return enriched;
  }),

  // Content activity over time (last 30 days, grouped by day)
  activityTimeline: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const posts = await db
      .select({
        date: sql<string>`DATE(${forumThreads.createdAt}) as post_date`,
        count: sql<number>`count(*) as post_count`,
      })
      .from(forumThreads)
      .where(gte(forumThreads.createdAt, thirtyDaysAgo))
      .groupBy(sql`post_date`)
      .orderBy(sql`post_date`);

    const comments = await db
      .select({
        date: sql<string>`DATE(${forumPosts.createdAt}) as comment_date`,
        count: sql<number>`count(*) as comment_count`,
      })
      .from(forumPosts)
      .where(gte(forumPosts.createdAt, thirtyDaysAgo))
      .groupBy(sql`comment_date`)
      .orderBy(sql`comment_date`);

    // Merge into a timeline
    const dateMap = new Map<string, { posts: number; comments: number }>();
    posts.forEach((p) =>
      dateMap.set(p.date, { posts: Number(p.count), comments: 0 })
    );
    comments.forEach((c) => {
      const existing = dateMap.get(c.date) || { posts: 0, comments: 0 };
      existing.comments = Number(c.count);
      dateMap.set(c.date, existing);
    });

    return Array.from(dateMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }),

  // Course engagement stats
  courseStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const stats = await db
      .select({
        courseId: courseEnrollments.courseId,
        totalEnrolled: sql<number>`count(*)`,
        avgProgress: sql<number>`AVG(${courseEnrollments.progressPercent})`,
        completed: sql<number>`SUM(CASE WHEN ${courseEnrollments.status} = 'completed' THEN 1 ELSE 0 END)`,
      })
      .from(courseEnrollments)
      .groupBy(courseEnrollments.courseId);

    return stats.map((s) => ({
      courseId: s.courseId,
      totalEnrolled: Number(s.totalEnrolled),
      avgProgress: Math.round(Number(s.avgProgress ?? 0)),
      completed: Number(s.completed ?? 0),
    }));
  }),

  // Event engagement stats
  eventStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { upcoming: 0, totalRegistrations: 0, avgAttendance: 0 };

    const now = new Date();

    const [upcoming] = await db
      .select({ count: sql<number>`count(*)` })
      .from(communityEvents)
      .where(
        and(
          eq(communityEvents.status, "published"),
          gte(communityEvents.startAt, now)
        )
      );

    const [totalRegs] = await db
      .select({ count: sql<number>`count(*)` })
      .from(eventRegistrations)
      .where(eq(eventRegistrations.status, "registered"));

    const [attended] = await db
      .select({ count: sql<number>`count(*)` })
      .from(eventRegistrations)
      .where(eq(eventRegistrations.status, "attended"));

    return {
      upcoming: Number(upcoming?.count ?? 0),
      totalRegistrations: Number(totalRegs?.count ?? 0),
      totalAttended: Number(attended?.count ?? 0),
    };
  }),

  // Challenge completion rates
  challengeStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const stats = await db
      .select({
        challengeId: userChallenges.challengeId,
        totalParticipants: sql<number>`count(*)`,
        completed: sql<number>`SUM(CASE WHEN ${userChallenges.status} = 'completed' THEN 1 ELSE 0 END)`,
        avgProgress: sql<number>`AVG(${userChallenges.currentProgress} / ${userChallenges.targetProgress} * 100)`,
      })
      .from(userChallenges)
      .groupBy(userChallenges.challengeId);

    return stats.map((s) => ({
      challengeId: s.challengeId,
      totalParticipants: Number(s.totalParticipants),
      completed: Number(s.completed ?? 0),
      avgProgress: Math.round(Number(s.avgProgress ?? 0)),
      completionRate:
        Number(s.totalParticipants) > 0
          ? Math.round(
              (Number(s.completed ?? 0) / Number(s.totalParticipants)) * 100
            )
          : 0,
    }));
  }),
});
