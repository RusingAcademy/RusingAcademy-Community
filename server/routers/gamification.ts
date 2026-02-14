import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { learnerXp, learnerBadges, xpTransactions, users } from "../../drizzle/schema";

export const gamificationRouter = router({
  // ── Leaderboard ─────────────────────────────────────────────
  leaderboard: publicProcedure
    .input(
      z.object({
        period: z.enum(["weekly", "monthly", "all_time"]).default("weekly"),
        limit: z.number().min(1).max(100).default(25),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const xpColumn =
        input.period === "weekly"
          ? learnerXp.weeklyXp
          : input.period === "monthly"
            ? learnerXp.monthlyXp
            : learnerXp.totalXp;

      return db
        .select({
          userId: learnerXp.userId,
          totalXp: learnerXp.totalXp,
          weeklyXp: learnerXp.weeklyXp,
          monthlyXp: learnerXp.monthlyXp,
          currentLevel: learnerXp.currentLevel,
          levelTitle: learnerXp.levelTitle,
          currentStreak: learnerXp.currentStreak,
          userName: users.name,
          userAvatar: users.avatarUrl,
          userRole: users.role,
        })
        .from(learnerXp)
        .leftJoin(users, eq(learnerXp.userId, users.id))
        .orderBy(desc(xpColumn))
        .limit(input.limit);
    }),

  // ── My XP Stats ─────────────────────────────────────────────
  myStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const xp = await db.select().from(learnerXp).where(eq(learnerXp.userId, ctx.user.id)).limit(1);
    if (xp.length === 0) {
      return {
        totalXp: 0,
        weeklyXp: 0,
        monthlyXp: 0,
        currentLevel: 1,
        levelTitle: "Beginner",
        currentStreak: 0,
        longestStreak: 0,
        badges: [],
        recentTransactions: [],
      };
    }

    const badges = await db
      .select()
      .from(learnerBadges)
      .where(eq(learnerBadges.userId, ctx.user.id))
      .orderBy(desc(learnerBadges.awardedAt));

    const recentTx = await db
      .select()
      .from(xpTransactions)
      .where(eq(xpTransactions.userId, ctx.user.id))
      .orderBy(desc(xpTransactions.createdAt))
      .limit(10);

    return {
      ...xp[0],
      badges,
      recentTransactions: recentTx,
    };
  }),

  // ── My Badges ───────────────────────────────────────────────
  myBadges: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(learnerBadges)
      .where(eq(learnerBadges.userId, ctx.user.id))
      .orderBy(desc(learnerBadges.awardedAt));
  }),

  // ── Mark badges as seen ─────────────────────────────────────
  markBadgesSeen: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return;

    await db
      .update(learnerBadges)
      .set({ isNew: false })
      .where(eq(learnerBadges.userId, ctx.user.id));

    return { success: true };
  }),

  // ── XP History ──────────────────────────────────────────────
  xpHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      return db
        .select()
        .from(xpTransactions)
        .where(eq(xpTransactions.userId, ctx.user.id))
        .orderBy(desc(xpTransactions.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),
});
