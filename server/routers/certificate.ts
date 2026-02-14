import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { certificates, courses, users, courseEnrollments, lessonProgress } from "../../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RA-${year}-${random}`;
}

export const certificateRouter = router({
  // List my certificates
  myCertificates: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db.select({
      certificate: certificates,
      course: {
        id: courses.id,
        title: courses.title,
        thumbnailUrl: courses.thumbnailUrl,
      },
    }).from(certificates)
      .innerJoin(courses, eq(certificates.courseId, courses.id))
      .where(eq(certificates.userId, ctx.user.id))
      .orderBy(desc(certificates.issuedAt));
  }),

  // Get certificate by number (public verification)
  verify: publicProcedure.input(z.object({ certificateNumber: z.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;

    const [cert] = await db.select({
      certificate: certificates,
      course: {
        title: courses.title,
      },
    }).from(certificates)
      .innerJoin(courses, eq(certificates.courseId, courses.id))
      .where(eq(certificates.certificateNumber, input.certificateNumber))
      .limit(1);

    return cert ?? null;
  }),

  // Issue certificate for a completed course
  issueCertificate: protectedProcedure.input(z.object({
    courseId: z.number(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Check enrollment
    const [enrollment] = await db.select().from(courseEnrollments)
      .where(and(
        eq(courseEnrollments.userId, ctx.user.id),
        eq(courseEnrollments.courseId, input.courseId),
      )).limit(1);

    if (!enrollment) throw new TRPCError({ code: "NOT_FOUND", message: "Not enrolled in this course" });

    // Check if certificate already exists
    const [existing] = await db.select().from(certificates)
      .where(and(
        eq(certificates.userId, ctx.user.id),
        eq(certificates.courseId, input.courseId),
      )).limit(1);

    if (existing) return { certificate: existing, alreadyExists: true };

    // Get course info
    const [course] = await db.select().from(courses)
      .where(eq(courses.id, input.courseId)).limit(1);

    if (!course) throw new TRPCError({ code: "NOT_FOUND" });

    const certNumber = generateCertificateNumber();
    const result = await db.insert(certificates).values({
      userId: ctx.user.id,
      courseId: input.courseId,
      certificateNumber: certNumber,
      title: `Certificate of Completion — ${course.title}`,
      titleFr: `Certificat d'achèvement — ${course.title}`,
      recipientName: ctx.user.name ?? "Learner",
      completedAt: new Date(),
      metadata: {
        courseDuration: course.totalDurationMinutes,
        courseLevel: course.level,
        completionDate: new Date().toISOString(),
      },
    });

    return {
      certificate: {
        id: Number(result[0].insertId),
        certificateNumber: certNumber,
        title: `Certificate of Completion — ${course.title}`,
      },
      alreadyExists: false,
    };
  }),

  // Admin: list all certificates
  adminList: protectedProcedure.input(z.object({
    limit: z.number().min(1).max(100).default(50),
  }).optional()).query(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return [];

    return db.select({
      certificate: certificates,
      user: {
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
      },
      course: {
        id: courses.id,
        title: courses.title,
      },
    }).from(certificates)
      .innerJoin(users, eq(certificates.userId, users.id))
      .innerJoin(courses, eq(certificates.courseId, courses.id))
      .orderBy(desc(certificates.issuedAt))
      .limit(input?.limit ?? 50);
  }),
});
