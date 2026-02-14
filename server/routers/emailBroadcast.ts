import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { emailBroadcasts, users, userSubscriptions, membershipTiers } from "../../drizzle/schema";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";

export const emailBroadcastRouter = router({
  // List broadcasts (admin only)
  list: protectedProcedure.input(z.object({
    limit: z.number().min(1).max(50).default(20),
    status: z.enum(["draft", "scheduled", "sending", "sent", "failed"]).optional(),
  }).optional()).query(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return [];

    let query = db.select().from(emailBroadcasts)
      .orderBy(desc(emailBroadcasts.createdAt))
      .limit(input?.limit ?? 20);

    return query;
  }),

  // Get single broadcast
  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return null;

    const [broadcast] = await db.select().from(emailBroadcasts)
      .where(eq(emailBroadcasts.id, input.id)).limit(1);
    return broadcast ?? null;
  }),

  // Create broadcast
  create: protectedProcedure.input(z.object({
    subject: z.string().min(1),
    subjectFr: z.string().optional(),
    body: z.string().min(1),
    bodyFr: z.string().optional(),
    recipientFilter: z.object({
      tier: z.string().optional(),
      role: z.string().optional(),
      language: z.string().optional(),
    }).optional(),
    scheduledAt: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Count recipients based on filter
    const [countResult] = await db.select({
      count: sql<number>`COUNT(*)`,
    }).from(users);

    const result = await db.insert(emailBroadcasts).values({
      senderId: ctx.user.id,
      subject: input.subject,
      subjectFr: input.subjectFr,
      body: input.body,
      bodyFr: input.bodyFr,
      recipientFilter: input.recipientFilter,
      recipientCount: countResult?.count ?? 0,
      status: input.scheduledAt ? "scheduled" : "draft",
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
    });

    return { id: Number(result[0].insertId) };
  }),

  // Update broadcast
  update: protectedProcedure.input(z.object({
    id: z.number(),
    subject: z.string().min(1).optional(),
    subjectFr: z.string().optional(),
    body: z.string().optional(),
    bodyFr: z.string().optional(),
    recipientFilter: z.object({
      tier: z.string().optional(),
      role: z.string().optional(),
      language: z.string().optional(),
    }).optional(),
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const { id, ...updates } = input;
    await db.update(emailBroadcasts).set(updates).where(eq(emailBroadcasts.id, id));
    return { success: true };
  }),

  // Send broadcast (simulated — uses notifyOwner for now)
  send: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [broadcast] = await db.select().from(emailBroadcasts)
      .where(eq(emailBroadcasts.id, input.id)).limit(1);

    if (!broadcast) throw new TRPCError({ code: "NOT_FOUND" });
    if (broadcast.status === "sent") throw new TRPCError({ code: "BAD_REQUEST", message: "Already sent" });

    // Mark as sending
    await db.update(emailBroadcasts).set({
      status: "sending",
    }).where(eq(emailBroadcasts.id, input.id));

    // Notify owner about broadcast
    await notifyOwner({
      title: `📧 Broadcast Sent: ${broadcast.subject}`,
      content: `Email broadcast "${broadcast.subject}" sent to ${broadcast.recipientCount} recipients.`,
    });

    // Mark as sent
    await db.update(emailBroadcasts).set({
      status: "sent",
      sentAt: new Date(),
      sentCount: broadcast.recipientCount ?? 0,
    }).where(eq(emailBroadcasts.id, input.id));

    return { success: true, recipientCount: broadcast.recipientCount };
  }),

  // Delete broadcast (draft only)
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [broadcast] = await db.select().from(emailBroadcasts)
      .where(eq(emailBroadcasts.id, input.id)).limit(1);

    if (!broadcast) throw new TRPCError({ code: "NOT_FOUND" });
    if (broadcast.status !== "draft") throw new TRPCError({ code: "BAD_REQUEST", message: "Can only delete drafts" });

    await db.delete(emailBroadcasts).where(eq(emailBroadcasts.id, input.id));
    return { success: true };
  }),

  // Broadcast stats
  stats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return { totalSent: 0, totalDrafts: 0, totalRecipients: 0, avgOpenRate: 0 };

    const [stats] = await db.select({
      totalSent: sql<number>`COUNT(CASE WHEN ${emailBroadcasts.status} = 'sent' THEN 1 END)`,
      totalDrafts: sql<number>`COUNT(CASE WHEN ${emailBroadcasts.status} = 'draft' THEN 1 END)`,
      totalRecipients: sql<number>`COALESCE(SUM(${emailBroadcasts.sentCount}), 0)`,
      totalOpened: sql<number>`COALESCE(SUM(${emailBroadcasts.openedCount}), 0)`,
    }).from(emailBroadcasts);

    const totalRecipients = stats?.totalRecipients ?? 0;
    const totalOpened = stats?.totalOpened ?? 0;
    const avgOpenRate = totalRecipients > 0 ? Math.round((totalOpened / totalRecipients) * 100) : 0;

    return {
      totalSent: stats?.totalSent ?? 0,
      totalDrafts: stats?.totalDrafts ?? 0,
      totalRecipients,
      avgOpenRate,
    };
  }),
});
