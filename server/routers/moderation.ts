import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  contentReports,
  userSuspensions,
  users,
  forumThreads,
  forumPosts,
} from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const moderationRouter = router({
  // Report content
  reportContent: protectedProcedure
    .input(
      z.object({
        contentType: z.enum(["thread", "comment", "message", "user"]),
        contentId: z.number(),
        reason: z.enum([
          "spam",
          "harassment",
          "hate_speech",
          "inappropriate",
          "misinformation",
          "copyright",
          "other",
        ]),
        description: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db.insert(contentReports).values({
        reporterId: ctx.user.id,
        contentType: input.contentType,
        contentId: input.contentId,
        reason: input.reason,
        description: input.description,
      });

      return { id: result.insertId };
    }),

  // Admin: list reports (pending first)
  listReports: adminProcedure
    .input(
      z.object({
        status: z
          .enum(["pending", "reviewed", "resolved", "dismissed"])
          .optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { reports: [], total: 0 };

      const conditions = input.status
        ? eq(contentReports.status, input.status)
        : undefined;

      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(contentReports)
        .where(conditions);

      const reports = await db
        .select({
          id: contentReports.id,
          reporterId: contentReports.reporterId,
          contentType: contentReports.contentType,
          contentId: contentReports.contentId,
          reason: contentReports.reason,
          description: contentReports.description,
          status: contentReports.status,
          createdAt: contentReports.createdAt,
        })
        .from(contentReports)
        .where(conditions)
        .orderBy(desc(contentReports.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Enrich with reporter info
      const enriched = await Promise.all(
        reports.map(async (report) => {
          const [reporter] = await db
            .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
            .from(users)
            .where(eq(users.id, report.reporterId))
            .limit(1);
          return { ...report, reporter };
        })
      );

      return { reports: enriched, total: Number(countResult?.count ?? 0) };
    }),

  // Admin: resolve a report
  resolveReport: adminProcedure
    .input(
      z.object({
        reportId: z.number(),
        status: z.enum(["resolved", "dismissed"]),
        resolution: z.string().max(1000).optional(),
        hideContent: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(contentReports)
        .set({
          status: input.status,
          reviewedById: ctx.user.id,
          reviewedAt: new Date(),
          resolution: input.resolution,
        })
        .where(eq(contentReports.id, input.reportId));

      // If resolved and hideContent, hide the reported content
      if (input.status === "resolved" && input.hideContent) {
        const [report] = await db
          .select()
          .from(contentReports)
          .where(eq(contentReports.id, input.reportId))
          .limit(1);

        if (report) {
          if (report.contentType === "thread") {
            await db
              .update(forumThreads)
              .set({ status: "hidden" })
              .where(eq(forumThreads.id, report.contentId));
          } else if (report.contentType === "comment") {
            await db
              .update(forumPosts)
              .set({ status: "hidden" })
              .where(eq(forumPosts.id, report.contentId));
          }
        }
      }

      return { success: true };
    }),

  // Admin: suspend a user
  suspendUser: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        reason: z.string().min(1).max(1000),
        durationDays: z.number().min(1).max(365).optional(), // null = permanent
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const expiresAt = input.durationDays
        ? new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1000)
        : null;

      const [result] = await db.insert(userSuspensions).values({
        userId: input.userId,
        suspendedById: ctx.user.id,
        reason: input.reason,
        expiresAt,
      });

      return { id: result.insertId };
    }),

  // Admin: lift a suspension
  liftSuspension: adminProcedure
    .input(z.object({ suspensionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(userSuspensions)
        .set({
          isActive: false,
          liftedAt: new Date(),
          liftedById: ctx.user.id,
        })
        .where(eq(userSuspensions.id, input.suspensionId));

      return { success: true };
    }),

  // Admin: list active suspensions
  listSuspensions: adminProcedure
    .input(
      z.object({
        activeOnly: z.boolean().default(true),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = input.activeOnly
        ? eq(userSuspensions.isActive, true)
        : undefined;

      const suspensions = await db
        .select()
        .from(userSuspensions)
        .where(conditions)
        .orderBy(desc(userSuspensions.suspendedAt))
        .limit(input.limit);

      // Enrich with user info
      const enriched = await Promise.all(
        suspensions.map(async (s) => {
          const [user] = await db
            .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl, email: users.email })
            .from(users)
            .where(eq(users.id, s.userId))
            .limit(1);
          return { ...s, user };
        })
      );

      return enriched;
    }),

  // Get report stats (for admin dashboard)
  stats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { pending: 0, resolved: 0, dismissed: 0, activeSuspensions: 0 };

    const [pending] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contentReports)
      .where(eq(contentReports.status, "pending"));

    const [resolved] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contentReports)
      .where(eq(contentReports.status, "resolved"));

    const [dismissed] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contentReports)
      .where(eq(contentReports.status, "dismissed"));

    const [activeSusp] = await db
      .select({ count: sql<number>`count(*)` })
      .from(userSuspensions)
      .where(eq(userSuspensions.isActive, true));

    return {
      pending: Number(pending?.count ?? 0),
      resolved: Number(resolved?.count ?? 0),
      dismissed: Number(dismissed?.count ?? 0),
      activeSuspensions: Number(activeSusp?.count ?? 0),
    };
  }),
});
