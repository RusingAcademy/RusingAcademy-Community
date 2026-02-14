import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { notebookEntries, notebookCorrections, users } from "../../drizzle/schema";

export const notebookRouter = router({
  // ── List Entries ────────────────────────────────────────────
  list: publicProcedure
    .input(
      z.object({
        language: z.enum(["french", "english"]).optional(),
        status: z.enum(["pending", "corrected", "archived"]).optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { entries: [], total: 0 };

      const conditions = [];
      if (input.language) conditions.push(eq(notebookEntries.language, input.language));
      if (input.status) conditions.push(eq(notebookEntries.status, input.status));

      const where = conditions.length === 0 ? undefined : conditions.length === 1 ? conditions[0] : and(...conditions);

      const baseQuery = db
        .select({
          id: notebookEntries.id,
          title: notebookEntries.title,
          content: notebookEntries.content,
          language: notebookEntries.language,
          status: notebookEntries.status,
          correctionCount: notebookEntries.correctionCount,
          createdAt: notebookEntries.createdAt,
          authorId: notebookEntries.authorId,
          authorName: users.name,
          authorAvatar: users.avatarUrl,
        })
        .from(notebookEntries)
        .leftJoin(users, eq(notebookEntries.authorId, users.id))
        .orderBy(desc(notebookEntries.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const result = where ? await baseQuery.where(where) : await baseQuery;

      const countBase = db
        .select({ count: sql<number>`count(*)` })
        .from(notebookEntries);

      const countResult = where ? await countBase.where(where) : await countBase;

      return { entries: result, total: countResult[0]?.count ?? 0 };
    }),

  // ── Get Entry with Corrections ──────────────────────────────
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const entry = await db
        .select({
          id: notebookEntries.id,
          title: notebookEntries.title,
          content: notebookEntries.content,
          language: notebookEntries.language,
          status: notebookEntries.status,
          correctionCount: notebookEntries.correctionCount,
          createdAt: notebookEntries.createdAt,
          authorId: notebookEntries.authorId,
          authorName: users.name,
          authorAvatar: users.avatarUrl,
        })
        .from(notebookEntries)
        .leftJoin(users, eq(notebookEntries.authorId, users.id))
        .where(eq(notebookEntries.id, input.id))
        .limit(1);

      if (entry.length === 0) return null;

      const corrections = await db
        .select({
          id: notebookCorrections.id,
          correctedContent: notebookCorrections.correctedContent,
          explanation: notebookCorrections.explanation,
          isAccepted: notebookCorrections.isAccepted,
          createdAt: notebookCorrections.createdAt,
          correctorId: notebookCorrections.correctorId,
          correctorName: users.name,
          correctorAvatar: users.avatarUrl,
        })
        .from(notebookCorrections)
        .leftJoin(users, eq(notebookCorrections.correctorId, users.id))
        .where(eq(notebookCorrections.entryId, input.id))
        .orderBy(desc(notebookCorrections.createdAt));

      return { ...entry[0], corrections };
    }),

  // ── Create Entry ────────────────────────────────────────────
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(3).max(255),
        content: z.string().min(10),
        language: z.enum(["french", "english"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(notebookEntries).values({
        authorId: ctx.user.id,
        title: input.title,
        content: input.content,
        language: input.language,
      });

      return { id: Number(result[0].insertId) };
    }),

  // ── Add Correction ──────────────────────────────────────────
  addCorrection: protectedProcedure
    .input(
      z.object({
        entryId: z.number(),
        correctedContent: z.string().min(1),
        explanation: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(notebookCorrections).values({
        entryId: input.entryId,
        correctorId: ctx.user.id,
        correctedContent: input.correctedContent,
        explanation: input.explanation,
      });

      // Update entry correction count and status
      await db.update(notebookEntries).set({
        correctionCount: sql`${notebookEntries.correctionCount} + 1`,
        status: "corrected",
      }).where(eq(notebookEntries.id, input.entryId));

      return { id: Number(result[0].insertId) };
    }),

  // ── My Entries ──────────────────────────────────────────────
  myEntries: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(notebookEntries)
      .where(eq(notebookEntries.authorId, ctx.user.id))
      .orderBy(desc(notebookEntries.createdAt));
  }),
});
