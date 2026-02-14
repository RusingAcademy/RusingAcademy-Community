import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { inAppNotifications } from "../../drizzle/schema";

export const notificationsRouter = router({
  // ── List My Notifications ───────────────────────────────────
  list: protectedProcedure
    .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { notifications: [], unreadCount: 0 };

      const notifications = await db
        .select()
        .from(inAppNotifications)
        .where(eq(inAppNotifications.userId, ctx.user.id))
        .orderBy(desc(inAppNotifications.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const unreadResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(inAppNotifications)
        .where(and(eq(inAppNotifications.userId, ctx.user.id), eq(inAppNotifications.isRead, false)));

      return {
        notifications,
        unreadCount: unreadResult[0]?.count ?? 0,
      };
    }),

  // ── Mark All Read ───────────────────────────────────────────
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return;

    await db
      .update(inAppNotifications)
      .set({ isRead: true })
      .where(and(eq(inAppNotifications.userId, ctx.user.id), eq(inAppNotifications.isRead, false)));

    return { success: true };
  }),

  // ── Mark Single Read ────────────────────────────────────────
  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return;

      await db
        .update(inAppNotifications)
        .set({ isRead: true })
        .where(and(eq(inAppNotifications.id, input.id), eq(inAppNotifications.userId, ctx.user.id)));

      return { success: true };
    }),
});
