import { z } from "zod";
import { eq, desc, and, sql, asc } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  forumCategories,
  forumThreads,
  forumPosts,
  threadLikes,
  postLikes,
  users,
  learnerXp,
  xpTransactions,
} from "../../drizzle/schema";

export const forumRouter = router({
  // ── Categories ──────────────────────────────────────────────
  listCategories: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(forumCategories).where(eq(forumCategories.isActive, true)).orderBy(asc(forumCategories.sortOrder));
  }),

  // ── Feed / Threads ──────────────────────────────────────────
  listThreads: publicProcedure
    .input(
      z.object({
        contentType: z.enum(["article", "podcast", "exercise", "question"]).optional(),
        categoryId: z.number().optional(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { threads: [], total: 0 };

      const conditions = [eq(forumThreads.status, "active")];
      if (input.contentType) conditions.push(eq(forumThreads.contentType, input.contentType));
      if (input.categoryId) conditions.push(eq(forumThreads.categoryId, input.categoryId));

      const where = conditions.length === 1 ? conditions[0] : and(...conditions);

      const threads = await db
        .select({
          id: forumThreads.id,
          title: forumThreads.title,
          slug: forumThreads.slug,
          content: forumThreads.content,
          contentType: forumThreads.contentType,
          thumbnailUrl: forumThreads.thumbnailUrl,
          isPinned: forumThreads.isPinned,
          viewCount: forumThreads.viewCount,
          replyCount: forumThreads.replyCount,
          likeCount: forumThreads.likeCount,
          audioUrl: forumThreads.audioUrl,
          audioDurationSeconds: forumThreads.audioDurationSeconds,
          exerciseType: forumThreads.exerciseType,
          difficulty: forumThreads.difficulty,
          createdAt: forumThreads.createdAt,
          authorId: forumThreads.authorId,
          authorName: users.name,
          authorAvatar: users.avatarUrl,
          authorRole: users.role,
        })
        .from(forumThreads)
        .leftJoin(users, eq(forumThreads.authorId, users.id))
        .where(where!)
        .orderBy(desc(forumThreads.isPinned), desc(forumThreads.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(forumThreads)
        .where(where!);

      return { threads, total: countResult[0]?.count ?? 0 };
    }),

  getThread: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db
        .select({
          id: forumThreads.id,
          title: forumThreads.title,
          slug: forumThreads.slug,
          content: forumThreads.content,
          contentType: forumThreads.contentType,
          thumbnailUrl: forumThreads.thumbnailUrl,
          isPinned: forumThreads.isPinned,
          viewCount: forumThreads.viewCount,
          replyCount: forumThreads.replyCount,
          likeCount: forumThreads.likeCount,
          audioUrl: forumThreads.audioUrl,
          audioDurationSeconds: forumThreads.audioDurationSeconds,
          exerciseType: forumThreads.exerciseType,
          difficulty: forumThreads.difficulty,
          createdAt: forumThreads.createdAt,
          authorId: forumThreads.authorId,
          authorName: users.name,
          authorAvatar: users.avatarUrl,
          authorRole: users.role,
        })
        .from(forumThreads)
        .leftJoin(users, eq(forumThreads.authorId, users.id))
        .where(eq(forumThreads.id, input.id))
        .limit(1);

      if (result.length === 0) return null;

      // Increment view count
      await db.update(forumThreads).set({ viewCount: sql`${forumThreads.viewCount} + 1` }).where(eq(forumThreads.id, input.id));

      return result[0];
    }),

  createThread: protectedProcedure
    .input(
      z.object({
        title: z.string().min(3).max(255),
        content: z.string().min(10),
        contentType: z.enum(["article", "podcast", "exercise", "question"]).default("article"),
        categoryId: z.number(),
        thumbnailUrl: z.string().optional(),
        audioUrl: z.string().optional(),
        audioDurationSeconds: z.number().optional(),
        exerciseType: z.string().optional(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const slug = input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 200) + "-" + Date.now();

      const result = await db.insert(forumThreads).values({
        ...input,
        slug,
        authorId: ctx.user.id,
      });

      // Award XP for creating a post
      await awardXp(db, ctx.user.id, 15, "post_created", "thread", Number(result[0].insertId));

      // Update category post count
      await db.update(forumCategories)
        .set({ threadCount: sql`${forumCategories.threadCount} + 1` })
        .where(eq(forumCategories.id, input.categoryId));

      return { id: Number(result[0].insertId), slug };
    }),

  // ── Comments / Replies ──────────────────────────────────────
  listComments: publicProcedure
    .input(z.object({ threadId: z.number(), limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return db
        .select({
          id: forumPosts.id,
          content: forumPosts.content,
          parentId: forumPosts.parentId,
          likeCount: forumPosts.likeCount,
          isEdited: forumPosts.isEdited,
          createdAt: forumPosts.createdAt,
          authorId: forumPosts.authorId,
          authorName: users.name,
          authorAvatar: users.avatarUrl,
          authorRole: users.role,
        })
        .from(forumPosts)
        .leftJoin(users, eq(forumPosts.authorId, users.id))
        .where(and(eq(forumPosts.threadId, input.threadId), eq(forumPosts.status, "active")))
        .orderBy(asc(forumPosts.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  addComment: protectedProcedure
    .input(z.object({ threadId: z.number(), content: z.string().min(1), parentId: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(forumPosts).values({
        threadId: input.threadId,
        authorId: ctx.user.id,
        content: input.content,
        parentId: input.parentId ?? null,
      });

      // Update thread reply count
      await db.update(forumThreads)
        .set({ replyCount: sql`${forumThreads.replyCount} + 1`, lastReplyAt: new Date(), lastReplyById: ctx.user.id })
        .where(eq(forumThreads.id, input.threadId));

      // Award XP
      await awardXp(db, ctx.user.id, 5, "comment_added", "post", Number(result[0].insertId));

      return { id: Number(result[0].insertId) };
    }),

  // ── Likes ───────────────────────────────────────────────────
  toggleThreadLike: protectedProcedure
    .input(z.object({ threadId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existing = await db
        .select()
        .from(threadLikes)
        .where(and(eq(threadLikes.threadId, input.threadId), eq(threadLikes.userId, ctx.user.id)))
        .limit(1);

      if (existing.length > 0) {
        await db.delete(threadLikes).where(eq(threadLikes.id, existing[0].id));
        await db.update(forumThreads).set({ likeCount: sql`GREATEST(${forumThreads.likeCount} - 1, 0)` }).where(eq(forumThreads.id, input.threadId));
        return { liked: false };
      } else {
        await db.insert(threadLikes).values({ threadId: input.threadId, userId: ctx.user.id });
        await db.update(forumThreads).set({ likeCount: sql`${forumThreads.likeCount} + 1` }).where(eq(forumThreads.id, input.threadId));

        // Award XP to thread author
        const thread = await db.select({ authorId: forumThreads.authorId }).from(forumThreads).where(eq(forumThreads.id, input.threadId)).limit(1);
        if (thread[0] && thread[0].authorId !== ctx.user.id) {
          await awardXp(db, thread[0].authorId, 2, "like_received", "thread", input.threadId);
        }

        return { liked: true };
      }
    }),

  // ── Update Thread ─────────────────────────────────────────
  updateThread: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(3).max(255).optional(),
        content: z.string().min(10).optional(),
        contentType: z.enum(["article", "podcast", "exercise", "question"]).optional(),
        thumbnailUrl: z.string().optional(),
        audioUrl: z.string().optional(),
        audioDurationSeconds: z.number().optional(),
        exerciseType: z.string().optional(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify ownership
      const thread = await db.select({ authorId: forumThreads.authorId }).from(forumThreads).where(eq(forumThreads.id, input.id)).limit(1);
      if (!thread[0]) throw new Error("Thread not found");
      if (thread[0].authorId !== ctx.user.id && ctx.user.role !== "admin") throw new Error("Not authorized");

      const { id, ...updates } = input;
      const updateData: Record<string, any> = {};
      if (updates.title !== undefined) {
        updateData.title = updates.title;
        updateData.slug = updates.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 200) + "-" + Date.now();
      }
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.contentType !== undefined) updateData.contentType = updates.contentType;
      if (updates.thumbnailUrl !== undefined) updateData.thumbnailUrl = updates.thumbnailUrl;
      if (updates.audioUrl !== undefined) updateData.audioUrl = updates.audioUrl;
      if (updates.audioDurationSeconds !== undefined) updateData.audioDurationSeconds = updates.audioDurationSeconds;
      if (updates.exerciseType !== undefined) updateData.exerciseType = updates.exerciseType;
      if (updates.difficulty !== undefined) updateData.difficulty = updates.difficulty;

      if (Object.keys(updateData).length > 0) {
        await db.update(forumThreads).set(updateData).where(eq(forumThreads.id, id));
      }

      return { success: true };
    }),

  // ── Delete Thread (soft-delete) ─────────────────────────────
  deleteThread: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const thread = await db.select({ authorId: forumThreads.authorId, categoryId: forumThreads.categoryId }).from(forumThreads).where(eq(forumThreads.id, input.id)).limit(1);
      if (!thread[0]) throw new Error("Thread not found");
      if (thread[0].authorId !== ctx.user.id && ctx.user.role !== "admin") throw new Error("Not authorized");

      await db.update(forumThreads).set({ status: "deleted" }).where(eq(forumThreads.id, input.id));

      // Decrement category thread count
      await db.update(forumCategories)
        .set({ threadCount: sql`GREATEST(${forumCategories.threadCount} - 1, 0)` })
        .where(eq(forumCategories.id, thread[0].categoryId));

      return { success: true };
    }),

  // ── Undo Delete (restore) ──────────────────────────────────
  restoreThread: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const thread = await db.select({ authorId: forumThreads.authorId, categoryId: forumThreads.categoryId }).from(forumThreads).where(eq(forumThreads.id, input.id)).limit(1);
      if (!thread[0]) throw new Error("Thread not found");
      if (thread[0].authorId !== ctx.user.id && ctx.user.role !== "admin") throw new Error("Not authorized");

      await db.update(forumThreads).set({ status: "active" }).where(eq(forumThreads.id, input.id));

      await db.update(forumCategories)
        .set({ threadCount: sql`${forumCategories.threadCount} + 1` })
        .where(eq(forumCategories.id, thread[0].categoryId));

      return { success: true };
    }),

  // ── Toggle Comment Like ────────────────────────────────────
  toggleCommentLike: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existing = await db.select().from(postLikes).where(and(eq(postLikes.postId, input.postId), eq(postLikes.userId, ctx.user.id))).limit(1);

      if (existing.length > 0) {
        await db.delete(postLikes).where(eq(postLikes.id, existing[0].id));
        await db.update(forumPosts).set({ likeCount: sql`GREATEST(${forumPosts.likeCount} - 1, 0)` }).where(eq(forumPosts.id, input.postId));
        return { liked: false };
      } else {
        await db.insert(postLikes).values({ postId: input.postId, userId: ctx.user.id });
        await db.update(forumPosts).set({ likeCount: sql`${forumPosts.likeCount} + 1` }).where(eq(forumPosts.id, input.postId));
        return { liked: true };
      }
    }),

  // ── Edit Comment ───────────────────────────────────────────
  editComment: protectedProcedure
    .input(z.object({ id: z.number(), content: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const comment = await db.select({ authorId: forumPosts.authorId }).from(forumPosts).where(eq(forumPosts.id, input.id)).limit(1);
      if (!comment[0]) throw new Error("Comment not found");
      if (comment[0].authorId !== ctx.user.id && ctx.user.role !== "admin") throw new Error("Not authorized");

      await db.update(forumPosts).set({ content: input.content, isEdited: true, editedAt: new Date() }).where(eq(forumPosts.id, input.id));
      return { success: true };
    }),

  // ── Delete Comment (soft-delete) ───────────────────────────
  deleteComment: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const comment = await db.select({ authorId: forumPosts.authorId, threadId: forumPosts.threadId }).from(forumPosts).where(eq(forumPosts.id, input.id)).limit(1);
      if (!comment[0]) throw new Error("Comment not found");
      if (comment[0].authorId !== ctx.user.id && ctx.user.role !== "admin") throw new Error("Not authorized");

      await db.update(forumPosts).set({ status: "deleted" }).where(eq(forumPosts.id, input.id));
      await db.update(forumThreads).set({ replyCount: sql`GREATEST(${forumThreads.replyCount} - 1, 0)` }).where(eq(forumThreads.id, comment[0].threadId));
      return { success: true };
    }),

  getUserLikes: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { threadIds: [], postIds: [] };

    const tLikes = await db.select({ threadId: threadLikes.threadId }).from(threadLikes).where(eq(threadLikes.userId, ctx.user.id));
    const pLikes = await db.select({ postId: postLikes.postId }).from(postLikes).where(eq(postLikes.userId, ctx.user.id));

    return {
      threadIds: tLikes.map((l) => l.threadId),
      postIds: pLikes.map((l) => l.postId),
    };
  }),
});

// ── XP Helper ─────────────────────────────────────────────────
async function awardXp(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userId: number,
  amount: number,
  reason: string,
  referenceType?: string,
  referenceId?: number
) {
  // Record transaction
  await db.insert(xpTransactions).values({
    userId,
    amount,
    reason: reason as any,
    referenceType,
    referenceId,
  });

  // Upsert learner XP
  const existing = await db.select().from(learnerXp).where(eq(learnerXp.userId, userId)).limit(1);
  if (existing.length === 0) {
    await db.insert(learnerXp).values({
      userId,
      totalXp: amount,
      weeklyXp: amount,
      monthlyXp: amount,
      currentLevel: 1,
      levelTitle: "Beginner",
      lastActivityDate: new Date(),
    });
  } else {
    const newTotal = (existing[0].totalXp ?? 0) + amount;
    const newLevel = calculateLevel(newTotal);
    await db.update(learnerXp).set({
      totalXp: newTotal,
      weeklyXp: sql`${learnerXp.weeklyXp} + ${amount}`,
      monthlyXp: sql`${learnerXp.monthlyXp} + ${amount}`,
      currentLevel: newLevel.level,
      levelTitle: newLevel.title,
      lastActivityDate: new Date(),
    }).where(eq(learnerXp.userId, userId));
  }
}

function calculateLevel(totalXp: number): { level: number; title: string } {
  if (totalXp >= 10000) return { level: 10, title: "Legend" };
  if (totalXp >= 7500) return { level: 9, title: "Master" };
  if (totalXp >= 5000) return { level: 8, title: "Expert" };
  if (totalXp >= 3500) return { level: 7, title: "Specialist" };
  if (totalXp >= 2000) return { level: 6, title: "Advanced" };
  if (totalXp >= 1200) return { level: 5, title: "Proficient" };
  if (totalXp >= 700) return { level: 4, title: "Intermediate" };
  if (totalXp >= 350) return { level: 3, title: "Apprentice" };
  if (totalXp >= 100) return { level: 2, title: "Novice" };
  return { level: 1, title: "Beginner" };
}
