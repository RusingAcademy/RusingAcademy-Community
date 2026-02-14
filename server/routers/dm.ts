import { z } from "zod";
import { eq, and, or, desc, sql, asc } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { conversations, messages, users } from "../../drizzle/schema";

export const dmRouter = router({
  // List conversations for current user
  listConversations: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const result = await db
      .select({
        id: conversations.id,
        participantOneId: conversations.participantOneId,
        participantTwoId: conversations.participantTwoId,
        lastMessageAt: conversations.lastMessageAt,
        lastMessagePreview: conversations.lastMessagePreview,
        createdAt: conversations.createdAt,
      })
      .from(conversations)
      .where(
        or(
          eq(conversations.participantOneId, ctx.user.id),
          eq(conversations.participantTwoId, ctx.user.id)
        )
      )
      .orderBy(desc(conversations.lastMessageAt))
      .limit(50);

    // Enrich with participant info
    const enriched = await Promise.all(
      result.map(async (conv) => {
        const otherId =
          conv.participantOneId === ctx.user.id
            ? conv.participantTwoId
            : conv.participantOneId;
        const [other] = await db
          .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
          .from(users)
          .where(eq(users.id, otherId))
          .limit(1);

        // Count unread messages
        const [unreadResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, conv.id),
              eq(messages.isRead, false),
              sql`${messages.senderId} != ${ctx.user.id}`
            )
          );

        return {
          ...conv,
          otherUser: other || { id: otherId, name: "Unknown", avatarUrl: null },
          unreadCount: Number(unreadResult?.count ?? 0),
        };
      })
    );

    return enriched;
  }),

  // Get or create a conversation with another user
  getOrCreateConversation: protectedProcedure
    .input(z.object({ otherUserId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (input.otherUserId === ctx.user.id) {
        throw new Error("Cannot message yourself");
      }

      // Check for existing conversation (either direction)
      const [p1, p2] = [
        Math.min(ctx.user.id, input.otherUserId),
        Math.max(ctx.user.id, input.otherUserId),
      ];

      const existing = await db
        .select()
        .from(conversations)
        .where(
          or(
            and(
              eq(conversations.participantOneId, p1),
              eq(conversations.participantTwoId, p2)
            ),
            and(
              eq(conversations.participantOneId, p2),
              eq(conversations.participantTwoId, p1)
            )
          )
        )
        .limit(1);

      if (existing.length > 0) return existing[0];

      // Create new conversation
      const [result] = await db.insert(conversations).values({
        participantOneId: ctx.user.id,
        participantTwoId: input.otherUserId,
      });

      const [created] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, result.insertId))
        .limit(1);

      return created;
    }),

  // List messages in a conversation
  listMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        cursor: z.number().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { messages: [], nextCursor: undefined };

      // Verify user is participant
      const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, input.conversationId))
        .limit(1);

      if (
        !conv ||
        (conv.participantOneId !== ctx.user.id &&
          conv.participantTwoId !== ctx.user.id)
      ) {
        throw new Error("Access denied");
      }

      let query = db
        .select({
          id: messages.id,
          conversationId: messages.conversationId,
          senderId: messages.senderId,
          content: messages.content,
          isRead: messages.isRead,
          status: messages.status,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .where(
          input.cursor
            ? and(
                eq(messages.conversationId, input.conversationId),
                sql`${messages.id} < ${input.cursor}`
              )
            : eq(messages.conversationId, input.conversationId)
        )
        .orderBy(desc(messages.id))
        .limit(input.limit + 1);

      const result = await query;

      let nextCursor: number | undefined;
      if (result.length > input.limit) {
        const last = result.pop()!;
        nextCursor = last.id;
      }

      return { messages: result.reverse(), nextCursor };
    }),

  // Send a message
  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        content: z.string().min(1).max(5000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify user is participant
      const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, input.conversationId))
        .limit(1);

      if (
        !conv ||
        (conv.participantOneId !== ctx.user.id &&
          conv.participantTwoId !== ctx.user.id)
      ) {
        throw new Error("Access denied");
      }

      // Insert message
      const [result] = await db.insert(messages).values({
        conversationId: input.conversationId,
        senderId: ctx.user.id,
        content: input.content,
      });

      // Update conversation last message
      const preview =
        input.content.length > 100
          ? input.content.substring(0, 100) + "..."
          : input.content;

      await db
        .update(conversations)
        .set({
          lastMessageAt: new Date(),
          lastMessagePreview: preview,
        })
        .where(eq(conversations.id, input.conversationId));

      return { id: result.insertId };
    }),

  // Mark messages as read
  markRead: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return;

      await db
        .update(messages)
        .set({ isRead: true, readAt: new Date(), status: "read" })
        .where(
          and(
            eq(messages.conversationId, input.conversationId),
            sql`${messages.senderId} != ${ctx.user.id}`,
            eq(messages.isRead, false)
          )
        );
    }),

  // Get total unread count across all conversations
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return 0;

    // Get all conversation IDs where user is a participant
    const userConvs = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        or(
          eq(conversations.participantOneId, ctx.user.id),
          eq(conversations.participantTwoId, ctx.user.id)
        )
      );

    if (userConvs.length === 0) return 0;

    const convIds = userConvs.map((c) => c.id);

    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          sql`${messages.conversationId} IN (${sql.join(convIds.map(id => sql`${id}`), sql`, `)})`,
          eq(messages.isRead, false),
          sql`${messages.senderId} != ${ctx.user.id}`
        )
      );

    return Number(result?.count ?? 0);
  }),
});
