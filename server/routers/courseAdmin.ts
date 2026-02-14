import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { courses, courseModules, lessons } from "../../drizzle/schema";
import { eq, desc, asc, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

function adminGuard(role: string) {
  if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
}

export const courseAdminRouter = router({
  // List all courses (admin view)
  list: protectedProcedure.query(async ({ ctx }) => {
    adminGuard(ctx.user.role);
    const db = await getDb();
    if (!db) return [];
    return db.select().from(courses).orderBy(desc(courses.updatedAt));
  }),

  // Get single course with modules and lessons
  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    adminGuard(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [course] = await db.select().from(courses).where(eq(courses.id, input.id)).limit(1);
    if (!course) throw new TRPCError({ code: "NOT_FOUND" });

    const mods = await db.select().from(courseModules)
      .where(eq(courseModules.courseId, input.id))
      .orderBy(asc(courseModules.sortOrder));

    const lessonsData = await db.select().from(lessons)
      .where(eq(lessons.courseId, input.id))
      .orderBy(asc(lessons.sortOrder));

    return {
      course,
      modules: mods.map(m => ({
        ...m,
        lessons: lessonsData.filter(l => l.moduleId === m.id),
      })),
    };
  }),

  // Create course
  createCourse: protectedProcedure.input(z.object({
    title: z.string().min(1),
    titleFr: z.string().optional(),
    description: z.string().optional(),
    descriptionFr: z.string().optional(),
    shortDescription: z.string().optional(),
    category: z.string().optional(),
    level: z.string().optional(),
    targetLanguage: z.string().optional(),
    price: z.number().default(0),
    accessType: z.string().default("free"),
    thumbnailUrl: z.string().optional(),
    hasCertificate: z.boolean().default(true),
  })).mutation(async ({ ctx, input }) => {
    adminGuard(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const result = await db.insert(courses).values({
      title: input.title,
      titleFr: input.titleFr,
      slug,
      description: input.description,
      descriptionFr: input.descriptionFr,
      shortDescription: input.shortDescription,
      category: (input.category as any) ?? "sle_oral",
      level: (input.level as any) ?? "all_levels",
      targetLanguage: (input.targetLanguage as any) ?? "french",
      price: input.price,
      accessType: (input.accessType as any) ?? "free",
      thumbnailUrl: input.thumbnailUrl,
      hasCertificate: input.hasCertificate,
      instructorId: ctx.user.id,
      instructorName: ctx.user.name ?? "Admin",
      status: "draft",
    });

    return { id: Number(result[0].insertId), slug };
  }),

  // Update course
  updateCourse: protectedProcedure.input(z.object({
    id: z.number(),
    title: z.string().min(1).optional(),
    titleFr: z.string().optional(),
    description: z.string().optional(),
    descriptionFr: z.string().optional(),
    shortDescription: z.string().optional(),
    category: z.string().optional(),
    level: z.string().optional(),
    targetLanguage: z.string().optional(),
    price: z.number().optional(),
    accessType: z.string().optional(),
    thumbnailUrl: z.string().optional(),
    hasCertificate: z.boolean().optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
  })).mutation(async ({ ctx, input }) => {
    adminGuard(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const { id, ...data } = input;
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.titleFr !== undefined) updateData.titleFr = data.titleFr;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.descriptionFr !== undefined) updateData.descriptionFr = data.descriptionFr;
    if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.level !== undefined) updateData.level = data.level;
    if (data.targetLanguage !== undefined) updateData.targetLanguage = data.targetLanguage;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.accessType !== undefined) updateData.accessType = data.accessType;
    if (data.thumbnailUrl !== undefined) updateData.thumbnailUrl = data.thumbnailUrl;
    if (data.hasCertificate !== undefined) updateData.hasCertificate = data.hasCertificate;
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === "published") updateData.publishedAt = new Date();
    }

    await db.update(courses).set(updateData).where(eq(courses.id, id));
    return { success: true };
  }),

  // Delete course
  deleteCourse: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    adminGuard(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Delete lessons, modules, then course
    await db.delete(lessons).where(eq(lessons.courseId, input.id));
    await db.delete(courseModules).where(eq(courseModules.courseId, input.id));
    await db.delete(courses).where(eq(courses.id, input.id));
    return { success: true };
  }),

  // Add module
  addModule: protectedProcedure.input(z.object({
    courseId: z.number(),
    title: z.string().min(1),
    titleFr: z.string().optional(),
    description: z.string().optional(),
    sortOrder: z.number().default(0),
    isPreview: z.boolean().default(false),
  })).mutation(async ({ ctx, input }) => {
    adminGuard(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const result = await db.insert(courseModules).values({
      courseId: input.courseId,
      title: input.title,
      titleFr: input.titleFr,
      description: input.description,
      sortOrder: input.sortOrder,
      isPreview: input.isPreview,
    });

    return { id: Number(result[0].insertId) };
  }),

  // Update module
  updateModule: protectedProcedure.input(z.object({
    id: z.number(),
    title: z.string().optional(),
    titleFr: z.string().optional(),
    description: z.string().optional(),
    sortOrder: z.number().optional(),
    isPreview: z.boolean().optional(),
  })).mutation(async ({ ctx, input }) => {
    adminGuard(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const { id, ...data } = input;
    await db.update(courseModules).set(data as any).where(eq(courseModules.id, id));
    return { success: true };
  }),

  // Delete module
  deleteModule: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    adminGuard(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    await db.delete(lessons).where(eq(lessons.moduleId, input.id));
    await db.delete(courseModules).where(eq(courseModules.id, input.id));
    return { success: true };
  }),

  // Add lesson
  addLesson: protectedProcedure.input(z.object({
    moduleId: z.number(),
    courseId: z.number(),
    title: z.string().min(1),
    titleFr: z.string().optional(),
    description: z.string().optional(),
    contentType: z.string().default("video"),
    videoUrl: z.string().optional(),
    textContent: z.string().optional(),
    audioUrl: z.string().optional(),
    sortOrder: z.number().default(0),
    estimatedMinutes: z.number().default(10),
    isPreview: z.boolean().default(false),
    isMandatory: z.boolean().default(true),
  })).mutation(async ({ ctx, input }) => {
    adminGuard(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const result = await db.insert(lessons).values({
      moduleId: input.moduleId,
      courseId: input.courseId,
      title: input.title,
      titleFr: input.titleFr,
      description: input.description,
      contentType: input.contentType as any,
      videoUrl: input.videoUrl,
      textContent: input.textContent,
      audioUrl: input.audioUrl,
      sortOrder: input.sortOrder,
      estimatedMinutes: input.estimatedMinutes,
      isPreview: input.isPreview,
      isMandatory: input.isMandatory,
    });

    return { id: Number(result[0].insertId) };
  }),

  // Update lesson
  updateLesson: protectedProcedure.input(z.object({
    id: z.number(),
    title: z.string().optional(),
    titleFr: z.string().optional(),
    description: z.string().optional(),
    contentType: z.string().optional(),
    videoUrl: z.string().optional(),
    textContent: z.string().optional(),
    audioUrl: z.string().optional(),
    sortOrder: z.number().optional(),
    estimatedMinutes: z.number().optional(),
    isPreview: z.boolean().optional(),
    isMandatory: z.boolean().optional(),
  })).mutation(async ({ ctx, input }) => {
    adminGuard(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const { id, ...data } = input;
    await db.update(lessons).set(data as any).where(eq(lessons.id, id));
    return { success: true };
  }),

  // Delete lesson
  deleteLesson: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    adminGuard(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    await db.delete(lessons).where(eq(lessons.id, input.id));
    return { success: true };
  }),

  // Reorder modules
  reorderModules: protectedProcedure.input(z.object({
    courseId: z.number(),
    moduleIds: z.array(z.number()),
  })).mutation(async ({ ctx, input }) => {
    adminGuard(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    for (let i = 0; i < input.moduleIds.length; i++) {
      await db.update(courseModules)
        .set({ sortOrder: i })
        .where(and(eq(courseModules.id, input.moduleIds[i]), eq(courseModules.courseId, input.courseId)));
    }
    return { success: true };
  }),

  // Reorder lessons within a module
  reorderLessons: protectedProcedure.input(z.object({
    moduleId: z.number(),
    lessonIds: z.array(z.number()),
  })).mutation(async ({ ctx, input }) => {
    adminGuard(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    for (let i = 0; i < input.lessonIds.length; i++) {
      await db.update(lessons)
        .set({ sortOrder: i })
        .where(and(eq(lessons.id, input.lessonIds[i]), eq(lessons.moduleId, input.moduleId)));
    }
    return { success: true };
  }),

  // Publish course
  publishCourse: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    adminGuard(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Count modules and lessons
    const mods = await db.select().from(courseModules).where(eq(courseModules.courseId, input.id));
    const lessonsData = await db.select().from(lessons).where(eq(lessons.courseId, input.id));

    await db.update(courses).set({
      status: "published",
      publishedAt: new Date(),
      totalModules: mods.length,
      totalLessons: lessonsData.length,
    }).where(eq(courses.id, input.id));

    return { success: true, totalModules: mods.length, totalLessons: lessonsData.length };
  }),
});
