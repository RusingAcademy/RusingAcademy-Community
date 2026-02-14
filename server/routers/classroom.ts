import { z } from "zod";
import { eq, desc, and, sql, asc } from "drizzle-orm";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  courses,
  courseModules,
  lessons,
  courseEnrollments,
  lessonProgress,
  users,
} from "../../drizzle/schema";

export const classroomRouter = router({
  // ── List Courses ────────────────────────────────────────────
  listCourses: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        level: z.string().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { courses: [], total: 0 };

      const conditions = [eq(courses.status, "published")];
      if (input.category) conditions.push(eq(courses.category, input.category as any));
      if (input.level) conditions.push(eq(courses.level, input.level as any));

      const where = conditions.length === 1 ? conditions[0] : and(...conditions);

      const result = await db
        .select({
          id: courses.id,
          title: courses.title,
          titleFr: courses.titleFr,
          slug: courses.slug,
          shortDescription: courses.shortDescription,
          thumbnailUrl: courses.thumbnailUrl,
          category: courses.category,
          level: courses.level,
          targetLanguage: courses.targetLanguage,
          price: courses.price,
          accessType: courses.accessType,
          totalModules: courses.totalModules,
          totalLessons: courses.totalLessons,
          totalDurationMinutes: courses.totalDurationMinutes,
          totalEnrollments: courses.totalEnrollments,
          averageRating: courses.averageRating,
          totalReviews: courses.totalReviews,
          instructorName: courses.instructorName,
          hasCertificate: courses.hasCertificate,
          createdAt: courses.createdAt,
        })
        .from(courses)
        .where(where!)
        .orderBy(desc(courses.totalEnrollments))
        .limit(input.limit)
        .offset(input.offset);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(courses)
        .where(where!);

      return { courses: result, total: countResult[0]?.count ?? 0 };
    }),

  // ── Get Course with Modules ─────────────────────────────────
  getCourse: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const course = await db.select().from(courses).where(eq(courses.id, input.id)).limit(1);
      if (course.length === 0) return null;

      const modules = await db
        .select()
        .from(courseModules)
        .where(eq(courseModules.courseId, input.id))
        .orderBy(asc(courseModules.sortOrder));

      const moduleLessons = await db
        .select()
        .from(lessons)
        .where(eq(lessons.courseId, input.id))
        .orderBy(asc(lessons.sortOrder));

      return {
        ...course[0],
        modules: modules.map((mod) => ({
          ...mod,
          lessons: moduleLessons.filter((l) => l.moduleId === mod.id),
        })),
      };
    }),

  // ── Enroll in Course ────────────────────────────────────────
  enroll: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existing = await db
        .select()
        .from(courseEnrollments)
        .where(and(eq(courseEnrollments.courseId, input.courseId), eq(courseEnrollments.userId, ctx.user.id)))
        .limit(1);

      if (existing.length > 0) return { status: "already_enrolled", enrollmentId: existing[0].id };

      const course = await db.select().from(courses).where(eq(courses.id, input.courseId)).limit(1);
      if (!course[0]) throw new Error("Course not found");

      const result = await db.insert(courseEnrollments).values({
        userId: ctx.user.id,
        courseId: input.courseId,
        totalLessons: course[0].totalLessons ?? 0,
      });

      await db.update(courses).set({ totalEnrollments: sql`${courses.totalEnrollments} + 1` }).where(eq(courses.id, input.courseId));

      return { status: "enrolled", enrollmentId: Number(result[0].insertId) };
    }),

  // ── My Enrollments ──────────────────────────────────────────
  myEnrollments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select({
        enrollmentId: courseEnrollments.id,
        courseId: courseEnrollments.courseId,
        progressPercent: courseEnrollments.progressPercent,
        lessonsCompleted: courseEnrollments.lessonsCompleted,
        totalLessons: courseEnrollments.totalLessons,
        status: courseEnrollments.status,
        enrolledAt: courseEnrollments.enrolledAt,
        lastAccessedAt: courseEnrollments.lastAccessedAt,
        courseTitle: courses.title,
        courseTitleFr: courses.titleFr,
        courseSlug: courses.slug,
        courseThumbnail: courses.thumbnailUrl,
        courseCategory: courses.category,
        courseLevel: courses.level,
      })
      .from(courseEnrollments)
      .leftJoin(courses, eq(courseEnrollments.courseId, courses.id))
      .where(eq(courseEnrollments.userId, ctx.user.id))
      .orderBy(desc(courseEnrollments.lastAccessedAt));
  }),

  // ── Mark Lesson Complete ────────────────────────────────────
  completeLesson: protectedProcedure
    .input(z.object({ lessonId: z.number(), courseId: z.number(), moduleId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Upsert lesson progress
      const existing = await db
        .select()
        .from(lessonProgress)
        .where(and(eq(lessonProgress.lessonId, input.lessonId), eq(lessonProgress.userId, ctx.user.id)))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(lessonProgress).values({
          lessonId: input.lessonId,
          userId: ctx.user.id,
          courseId: input.courseId,
          moduleId: input.moduleId,
          status: "completed",
          progressPercent: 100,
          completedAt: new Date(),
          lastAccessedAt: new Date(),
        });
      } else {
        await db.update(lessonProgress).set({
          status: "completed",
          progressPercent: 100,
          completedAt: new Date(),
          lastAccessedAt: new Date(),
        }).where(eq(lessonProgress.id, existing[0].id));
      }

      // Update enrollment progress
      const completedCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(lessonProgress)
        .where(and(eq(lessonProgress.courseId, input.courseId), eq(lessonProgress.userId, ctx.user.id), eq(lessonProgress.status, "completed")));

      const enrollment = await db
        .select()
        .from(courseEnrollments)
        .where(and(eq(courseEnrollments.courseId, input.courseId), eq(courseEnrollments.userId, ctx.user.id)))
        .limit(1);

      if (enrollment[0]) {
        const total = enrollment[0].totalLessons || 1;
        const completed = completedCount[0]?.count ?? 0;
        const percent = Math.min(Math.round((completed / total) * 100), 100);

        await db.update(courseEnrollments).set({
          lessonsCompleted: completed,
          progressPercent: percent,
          lastAccessedAt: new Date(),
          ...(percent === 100 ? { completedAt: new Date(), status: "completed" as const } : {}),
        }).where(eq(courseEnrollments.id, enrollment[0].id));
      }

      return { success: true };
    }),
});
