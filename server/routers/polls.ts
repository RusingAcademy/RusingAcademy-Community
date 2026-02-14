import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { polls, pollVotes } from "../../drizzle/schema";

export const pollsRouter = router({
  // Get poll for a thread
  getByThread: publicProcedure
    .input(z.object({ threadId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;

      const [poll] = await db
        .select()
        .from(polls)
        .where(eq(polls.threadId, input.threadId))
        .limit(1);

      if (!poll) return null;

      // Get vote counts per option
      const voteCounts = await db
        .select({
          optionId: pollVotes.optionId,
          count: sql<number>`count(*)`,
        })
        .from(pollVotes)
        .where(eq(pollVotes.pollId, poll.id))
        .groupBy(pollVotes.optionId);

      // Check if current user has voted
      let userVotes: string[] = [];
      if (ctx.user) {
        const votes = await db
          .select({ optionId: pollVotes.optionId })
          .from(pollVotes)
          .where(
            and(eq(pollVotes.pollId, poll.id), eq(pollVotes.userId, ctx.user.id))
          );
        userVotes = votes.map((v) => v.optionId);
      }

      const options = (poll.options as { id: string; text: string }[]).map(
        (opt) => ({
          ...opt,
          votes: Number(
            voteCounts.find((vc) => vc.optionId === opt.id)?.count ?? 0
          ),
        })
      );

      return {
        ...poll,
        options,
        userVotes,
        isExpired: poll.endsAt ? new Date(poll.endsAt) < new Date() : false,
      };
    }),

  // Create a poll (attached to a thread)
  create: protectedProcedure
    .input(
      z.object({
        threadId: z.number(),
        question: z.string().min(1).max(500),
        options: z
          .array(z.object({ id: z.string(), text: z.string().min(1).max(200) }))
          .min(2)
          .max(10),
        allowMultiple: z.boolean().default(false),
        endsAt: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db.insert(polls).values({
        threadId: input.threadId,
        question: input.question,
        options: input.options,
        allowMultiple: input.allowMultiple,
        endsAt: input.endsAt,
      });

      return { id: result.insertId };
    }),

  // Vote on a poll
  vote: protectedProcedure
    .input(
      z.object({
        pollId: z.number(),
        optionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check poll exists and is not expired
      const [poll] = await db
        .select()
        .from(polls)
        .where(eq(polls.id, input.pollId))
        .limit(1);

      if (!poll) throw new Error("Poll not found");
      if (poll.endsAt && new Date(poll.endsAt) < new Date()) {
        throw new Error("Poll has ended");
      }

      // If not allowMultiple, remove existing vote first
      if (!poll.allowMultiple) {
        await db
          .delete(pollVotes)
          .where(
            and(
              eq(pollVotes.pollId, input.pollId),
              eq(pollVotes.userId, ctx.user.id)
            )
          );
      }

      // Insert vote (ignore duplicate)
      try {
        await db.insert(pollVotes).values({
          pollId: input.pollId,
          userId: ctx.user.id,
          optionId: input.optionId,
        });

        // Update total votes
        await db
          .update(polls)
          .set({ totalVotes: sql`${polls.totalVotes} + 1` })
          .where(eq(polls.id, input.pollId));
      } catch (e: any) {
        if (e.code === "ER_DUP_ENTRY") {
          // Already voted for this option, toggle off
          await db
            .delete(pollVotes)
            .where(
              and(
                eq(pollVotes.pollId, input.pollId),
                eq(pollVotes.userId, ctx.user.id),
                eq(pollVotes.optionId, input.optionId)
              )
            );
          await db
            .update(polls)
            .set({ totalVotes: sql`GREATEST(${polls.totalVotes} - 1, 0)` })
            .where(eq(polls.id, input.pollId));
        } else {
          throw e;
        }
      }

      return { success: true };
    }),
});
