import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { channels, channelMemberships, users, forumThreads } from "../../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const channelRouter = router({
  // List all public channels
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    return db.select().from(channels)
      .where(eq(channels.isActive, true))
      .orderBy(channels.sortOrder);
  }),

  // Get channel by slug
  getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;

    const [channel] = await db.select().from(channels)
      .where(and(eq(channels.slug, input.slug), eq(channels.isActive, true)))
      .limit(1);

    return channel ?? null;
  }),

  // Join a channel
  join: protectedProcedure.input(z.object({ channelId: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Check if already a member
    const [existing] = await db.select().from(channelMemberships)
      .where(and(
        eq(channelMemberships.channelId, input.channelId),
        eq(channelMemberships.userId, ctx.user.id),
      )).limit(1);

    if (existing) return { success: true, alreadyMember: true };

    await db.insert(channelMemberships).values({
      channelId: input.channelId,
      userId: ctx.user.id,
      role: "member",
    });

    // Increment member count
    await db.update(channels)
      .set({ memberCount: sql`${channels.memberCount} + 1` })
      .where(eq(channels.id, input.channelId));

    return { success: true, alreadyMember: false };
  }),

  // Leave a channel
  leave: protectedProcedure.input(z.object({ channelId: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    await db.delete(channelMemberships)
      .where(and(
        eq(channelMemberships.channelId, input.channelId),
        eq(channelMemberships.userId, ctx.user.id),
      ));

    await db.update(channels)
      .set({ memberCount: sql`GREATEST(${channels.memberCount} - 1, 0)` })
      .where(eq(channels.id, input.channelId));

    return { success: true };
  }),

  // My channels
  myChannels: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db.select({
      channel: channels,
      membership: channelMemberships,
    }).from(channelMemberships)
      .innerJoin(channels, eq(channelMemberships.channelId, channels.id))
      .where(eq(channelMemberships.userId, ctx.user.id))
      .orderBy(channels.sortOrder);
  }),

  // Channel members
  members: publicProcedure.input(z.object({
    channelId: z.number(),
    limit: z.number().min(1).max(100).default(50),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];

    return db.select({
      membership: channelMemberships,
      user: {
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
      },
    }).from(channelMemberships)
      .innerJoin(users, eq(channelMemberships.userId, users.id))
      .where(eq(channelMemberships.channelId, input.channelId))
      .orderBy(channelMemberships.joinedAt)
      .limit(input.limit);
  }),

  // Admin: create channel
  create: protectedProcedure.input(z.object({
    name: z.string().min(1),
    nameFr: z.string().optional(),
    slug: z.string().min(1),
    description: z.string().optional(),
    descriptionFr: z.string().optional(),
    visibility: z.enum(["public", "private", "premium"]).default("public"),
    requiredTierId: z.number().optional(),
    sortOrder: z.number().default(0),
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const result = await db.insert(channels).values({
      ...input,
      createdById: ctx.user.id,
    });

    // Auto-join the creator
    const channelId = Number(result[0].insertId);
    await db.insert(channelMemberships).values({
      channelId,
      userId: ctx.user.id,
      role: "admin",
    });

    await db.update(channels)
      .set({ memberCount: 1 })
      .where(eq(channels.id, channelId));

    return { id: channelId };
  }),

  // Admin: update channel
  update: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    nameFr: z.string().optional(),
    description: z.string().optional(),
    descriptionFr: z.string().optional(),
    visibility: z.enum(["public", "private", "premium"]).optional(),
    requiredTierId: z.number().optional(),
    isActive: z.boolean().optional(),
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const { id, ...updates } = input;
    await db.update(channels).set(updates).where(eq(channels.id, id));
    return { success: true };
  }),
});
