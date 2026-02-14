import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  courses,
  courseModules,
  lessons,
  courseEnrollments,
  lessonProgress,
  certificates,
  users,
} from "../../drizzle/schema";
import { eq, and, asc, sql, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

export const coursePlayerRouter = router({
  // ──────────────────────────────────────────────────────────────────────
  // PUBLIC: Course Catalog (published courses only)
  // ──────────────────────────────────────────────────────────────────────
  catalog: publicProcedure
    .input(
      z
        .object({
          category: z.string().optional(),
          level: z.string().optional(),
          language: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const rows = await db
        .select()
        .from(courses)
        .where(eq(courses.status, "published"))
        .orderBy(desc(courses.publishedAt));

      return rows.map((c) => ({
        ...c,
        price: c.price ?? 0,
      }));
    }),

  // ──────────────────────────────────────────────────────────────────────
  // PUBLIC: Single course detail with modules & lessons
  // ──────────────────────────────────────────────────────────────────────
  courseDetail: publicProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, input.courseId))
        .limit(1);

      if (!course) throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });

      const modules = await db
        .select()
        .from(courseModules)
        .where(eq(courseModules.courseId, input.courseId))
        .orderBy(asc(courseModules.sortOrder));

      const allLessons = await db
        .select()
        .from(lessons)
        .where(eq(lessons.courseId, input.courseId))
        .orderBy(asc(lessons.sortOrder));

      const modulesWithLessons = modules.map((mod) => ({
        ...mod,
        lessons: allLessons.filter((l) => l.moduleId === mod.id),
      }));

      return { course, modules: modulesWithLessons };
    }),

  // ──────────────────────────────────────────────────────────────────────
  // PROTECTED: Enroll in a course
  // ──────────────────────────────────────────────────────────────────────
  enroll: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, input.courseId))
        .limit(1);

      if (!course) throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });

      // Check if already enrolled
      const [existing] = await db
        .select()
        .from(courseEnrollments)
        .where(
          and(
            eq(courseEnrollments.userId, ctx.user.id),
            eq(courseEnrollments.courseId, input.courseId)
          )
        )
        .limit(1);

      if (existing) return { enrollment: existing, alreadyEnrolled: true };

      // Count total lessons
      const [lessonCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(lessons)
        .where(eq(lessons.courseId, input.courseId));

      const [enrollment] = await db
        .insert(courseEnrollments)
        .values({
          userId: ctx.user.id,
          courseId: input.courseId,
          totalLessons: lessonCount?.count ?? 0,
        })
        .$returningId();

      // Increment enrollment count
      await db
        .update(courses)
        .set({ totalEnrollments: sql`${courses.totalEnrollments} + 1` })
        .where(eq(courses.id, input.courseId));

      return { enrollment: { id: enrollment.id }, alreadyEnrolled: false };
    }),

  // ──────────────────────────────────────────────────────────────────────
  // PROTECTED: My enrollments
  // ──────────────────────────────────────────────────────────────────────
  myEnrollments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const enrollments = await db
      .select({
        enrollment: courseEnrollments,
        course: courses,
      })
      .from(courseEnrollments)
      .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
      .where(eq(courseEnrollments.userId, ctx.user.id))
      .orderBy(desc(courseEnrollments.enrolledAt));

    return enrollments;
  }),

  // ──────────────────────────────────────────────────────────────────────
  // PROTECTED: Get my progress for a course
  // ──────────────────────────────────────────────────────────────────────
  courseProgress: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      const [enrollment] = await db
        .select()
        .from(courseEnrollments)
        .where(
          and(
            eq(courseEnrollments.userId, ctx.user.id),
            eq(courseEnrollments.courseId, input.courseId)
          )
        )
        .limit(1);

      if (!enrollment) return null;

      const progress = await db
        .select()
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.userId, ctx.user.id),
            eq(lessonProgress.courseId, input.courseId)
          )
        );

      return {
        enrollment,
        lessonProgress: progress,
        completedLessons: progress.filter((p) => p.status === "completed").length,
        totalLessons: enrollment.totalLessons ?? 0,
      };
    }),

  // ──────────────────────────────────────────────────────────────────────
  // PROTECTED: Get lesson content (with access check)
  // ──────────────────────────────────────────────────────────────────────
  lessonContent: protectedProcedure
    .input(z.object({ lessonId: z.number(), courseId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify enrollment
      const [enrollment] = await db
        .select()
        .from(courseEnrollments)
        .where(
          and(
            eq(courseEnrollments.userId, ctx.user.id),
            eq(courseEnrollments.courseId, input.courseId)
          )
        )
        .limit(1);

      if (!enrollment) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be enrolled to access this lesson",
        });
      }

      const [lesson] = await db
        .select()
        .from(lessons)
        .where(eq(lessons.id, input.lessonId))
        .limit(1);

      if (!lesson) throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });

      // Get or create progress record
      const [progress] = await db
        .select()
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.userId, ctx.user.id),
            eq(lessonProgress.lessonId, input.lessonId)
          )
        )
        .limit(1);

      if (!progress) {
        await db.insert(lessonProgress).values({
          userId: ctx.user.id,
          lessonId: input.lessonId,
          courseId: input.courseId,
          moduleId: lesson.moduleId,
          status: "in_progress",
          lastAccessedAt: new Date(),
        });
      } else {
        await db
          .update(lessonProgress)
          .set({ lastAccessedAt: new Date() })
          .where(eq(lessonProgress.id, progress.id));
      }

      // Update enrollment lastAccessedAt
      await db
        .update(courseEnrollments)
        .set({ lastAccessedAt: new Date() })
        .where(eq(courseEnrollments.id, enrollment.id));

      return { lesson, progress };
    }),

  // ──────────────────────────────────────────────────────────────────────
  // PROTECTED: Mark lesson as complete
  // ──────────────────────────────────────────────────────────────────────
  completeLesson: protectedProcedure
    .input(
      z.object({
        lessonId: z.number(),
        courseId: z.number(),
        timeSpentSeconds: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const userId = ctx.user.id;

      // Upsert lesson progress
      const [existing] = await db
        .select()
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.userId, userId),
            eq(lessonProgress.lessonId, input.lessonId)
          )
        )
        .limit(1);

      if (existing) {
        await db
          .update(lessonProgress)
          .set({
            status: "completed",
            progressPercent: 100,
            completedAt: new Date(),
            timeSpentSeconds: (existing.timeSpentSeconds ?? 0) + (input.timeSpentSeconds ?? 0),
          })
          .where(eq(lessonProgress.id, existing.id));
      } else {
        const [lesson] = await db
          .select()
          .from(lessons)
          .where(eq(lessons.id, input.lessonId))
          .limit(1);

        await db.insert(lessonProgress).values({
          userId,
          lessonId: input.lessonId,
          courseId: input.courseId,
          moduleId: lesson?.moduleId,
          status: "completed",
          progressPercent: 100,
          completedAt: new Date(),
          timeSpentSeconds: input.timeSpentSeconds ?? 0,
        });
      }

      // Recalculate enrollment progress
      const [enrollment] = await db
        .select()
        .from(courseEnrollments)
        .where(
          and(
            eq(courseEnrollments.userId, userId),
            eq(courseEnrollments.courseId, input.courseId)
          )
        )
        .limit(1);

      if (enrollment) {
        const [completedCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(lessonProgress)
          .where(
            and(
              eq(lessonProgress.userId, userId),
              eq(lessonProgress.courseId, input.courseId),
              eq(lessonProgress.status, "completed")
            )
          );

        const completed = completedCount?.count ?? 0;
        const total = enrollment.totalLessons ?? 1;
        const percent = Math.round((completed / total) * 100);

        const isComplete = percent >= 100;

        await db
          .update(courseEnrollments)
          .set({
            lessonsCompleted: completed,
            progressPercent: Math.min(percent, 100),
            status: isComplete ? "completed" : "active",
            completedAt: isComplete ? new Date() : enrollment.completedAt,
          })
          .where(eq(courseEnrollments.id, enrollment.id));

        // Auto-issue certificate if course is complete
        if (isComplete) {
          await autoIssueCertificate(userId, input.courseId);
        }

        return { completed, total, percent: Math.min(percent, 100), courseCompleted: isComplete };
      }

      return { completed: 0, total: 0, percent: 0, courseCompleted: false };
    }),

  // ──────────────────────────────────────────────────────────────────────
  // PROTECTED: Get next lesson to continue
  // ──────────────────────────────────────────────────────────────────────
  nextLesson: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      // Get all lessons for the course ordered by module then lesson sort order
      const allLessons = await db
        .select({ lesson: lessons, module: courseModules })
        .from(lessons)
        .innerJoin(courseModules, eq(lessons.moduleId, courseModules.id))
        .where(eq(lessons.courseId, input.courseId))
        .orderBy(asc(courseModules.sortOrder), asc(lessons.sortOrder));

      // Get completed lesson IDs
      const completedProgress = await db
        .select()
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.userId, ctx.user.id),
            eq(lessonProgress.courseId, input.courseId),
            eq(lessonProgress.status, "completed")
          )
        );

      const completedIds = new Set(completedProgress.map((p) => p.lessonId));

      // Find first incomplete lesson
      const next = allLessons.find((l) => !completedIds.has(l.lesson.id));
      return next?.lesson ?? null;
    }),
});

// ──────────────────────────────────────────────────────────────────────
// Helper: Auto-issue certificate on course completion
// ──────────────────────────────────────────────────────────────────────
async function autoIssueCertificate(userId: number, courseId: number) {
  try {
    const db = await getDb();
    if (!db) return;

    // Check if certificate already exists
    const [existing] = await db
      .select()
      .from(certificates)
      .where(and(eq(certificates.userId, userId), eq(certificates.courseId, courseId)))
      .limit(1);

    if (existing) return;

    // Get course and user info
    const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!course || !user) return;

    // Only issue if course has certificate enabled
    if (!course.hasCertificate) return;

    const certNumber = `RA-${new Date().getFullYear()}-${nanoid(8).toUpperCase()}`;

    await db.insert(certificates).values({
      userId,
      courseId,
      certificateNumber: certNumber,
      title: course.title,
      titleFr: course.titleFr,
      recipientName: user.name ?? "Learner",
      completedAt: new Date(),
    });
  } catch (err) {
    console.error("[Certificate] Auto-issue failed:", err);
  }
}
