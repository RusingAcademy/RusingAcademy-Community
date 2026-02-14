import { z } from "zod";
import { eq, desc, and, gte, sql, asc } from "drizzle-orm";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { communityEvents, eventRegistrations, users } from "../../drizzle/schema";

export const eventsRouter = router({
  // ── List Events ─────────────────────────────────────────────
  list: publicProcedure
    .input(
      z.object({
        status: z.enum(["draft", "published", "cancelled", "completed"]).optional(),
        upcoming: z.boolean().default(true),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { events: [], total: 0 };

      const conditions = [];
      if (input.status) {
        conditions.push(eq(communityEvents.status, input.status));
      } else {
        conditions.push(eq(communityEvents.status, "published"));
      }
      if (input.upcoming) {
        conditions.push(gte(communityEvents.startAt, new Date()));
      }

      const where = conditions.length === 1 ? conditions[0] : and(...conditions);

      const events = await db
        .select()
        .from(communityEvents)
        .where(where!)
        .orderBy(asc(communityEvents.startAt))
        .limit(input.limit)
        .offset(input.offset);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(communityEvents)
        .where(where!);

      return { events, total: countResult[0]?.count ?? 0 };
    }),

  // ── Get Single Event ────────────────────────────────────────
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db
        .select()
        .from(communityEvents)
        .where(eq(communityEvents.id, input.id))
        .limit(1);

      return result[0] ?? null;
    }),

  // ── Create Event (Admin) ────────────────────────────────────
  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(3).max(255),
        titleFr: z.string().optional(),
        description: z.string().min(10),
        descriptionFr: z.string().optional(),
        eventType: z.enum(["workshop", "networking", "practice", "info_session", "webinar", "livestream", "other"]).default("workshop"),
        startAt: z.date(),
        endAt: z.date(),
        timezone: z.string().default("America/Toronto"),
        locationType: z.enum(["virtual", "in_person", "hybrid"]).default("virtual"),
        locationDetails: z.string().optional(),
        meetingUrl: z.string().optional(),
        maxCapacity: z.number().optional(),
        price: z.number().default(0),
        imageUrl: z.string().optional(),
        status: z.enum(["draft", "published"]).default("draft"),
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

      const result = await db.insert(communityEvents).values({
        ...input,
        slug,
        hostId: ctx.user.id,
        hostName: ctx.user.name ?? "Admin",
      });

      return { id: Number(result[0].insertId), slug };
    }),

  // ── Register for Event ──────────────────────────────────────
  register: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if already registered
      const existing = await db
        .select()
        .from(eventRegistrations)
        .where(and(eq(eventRegistrations.eventId, input.eventId), eq(eventRegistrations.userId, ctx.user.id)))
        .limit(1);

      if (existing.length > 0) {
        if (existing[0].status === "cancelled") {
          await db.update(eventRegistrations).set({ status: "registered", cancelledAt: null }).where(eq(eventRegistrations.id, existing[0].id));
          await db.update(communityEvents).set({ currentRegistrations: sql`${communityEvents.currentRegistrations} + 1` }).where(eq(communityEvents.id, input.eventId));
          return { status: "re-registered" };
        }
        return { status: "already_registered" };
      }

      // Check capacity
      const event = await db.select().from(communityEvents).where(eq(communityEvents.id, input.eventId)).limit(1);
      if (!event[0]) throw new Error("Event not found");

      const isWaitlisted = event[0].maxCapacity && (event[0].currentRegistrations ?? 0) >= event[0].maxCapacity;

      await db.insert(eventRegistrations).values({
        eventId: input.eventId,
        userId: ctx.user.id,
        status: isWaitlisted ? "waitlisted" : "registered",
        email: ctx.user.email,
        name: ctx.user.name,
      });

      await db.update(communityEvents).set({ currentRegistrations: sql`${communityEvents.currentRegistrations} + 1` }).where(eq(communityEvents.id, input.eventId));

      return { status: isWaitlisted ? "waitlisted" : "registered" };
    }),

  // ── Cancel Registration ─────────────────────────────────────
  cancelRegistration: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(eventRegistrations)
        .set({ status: "cancelled", cancelledAt: new Date() })
        .where(and(eq(eventRegistrations.eventId, input.eventId), eq(eventRegistrations.userId, ctx.user.id)));

      await db.update(communityEvents).set({ currentRegistrations: sql`GREATEST(${communityEvents.currentRegistrations} - 1, 0)` }).where(eq(communityEvents.id, input.eventId));

      return { success: true };
    }),

  // ── My Registrations ────────────────────────────────────────
  myRegistrations: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select({
        registrationId: eventRegistrations.id,
        eventId: eventRegistrations.eventId,
        status: eventRegistrations.status,
        registeredAt: eventRegistrations.registeredAt,
        eventTitle: communityEvents.title,
        eventStartAt: communityEvents.startAt,
        eventType: communityEvents.eventType,
        locationType: communityEvents.locationType,
      })
      .from(eventRegistrations)
      .leftJoin(communityEvents, eq(eventRegistrations.eventId, communityEvents.id))
      .where(eq(eventRegistrations.userId, ctx.user.id))
      .orderBy(desc(eventRegistrations.registeredAt));
  }),
});
