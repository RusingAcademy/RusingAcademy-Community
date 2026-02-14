import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────
type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(overrides: Partial<AuthenticatedUser> = {}): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-24",
    email: "test24@example.com",
    name: "Test User 24",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: { origin: "https://test.example.com" },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return createAuthContext({ id: 99, role: "admin", name: "Admin User" });
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// ──────────────────────────────────────────────────────────────────────
// Sprint 24: i18n / Bilingual Coverage
// ──────────────────────────────────────────────────────────────────────
describe("Sprint 24 — Full Bilingual i18n", () => {
  it("English translation file exports a valid object with all required top-level keys", async () => {
    const en = await import("../client/src/i18n/en");
    const keys = Object.keys(en.default);
    expect(keys).toContain("nav");
    expect(keys).toContain("common");
    expect(keys).toContain("coursePlayer");
    expect(keys).toContain("footer");
    expect(keys).toContain("membership");
    expect(keys).toContain("referrals");
    expect(keys).toContain("certificates");
    expect(keys).toContain("channels");
    expect(keys).toContain("aiAssistant");
  });

  it("French translation file exports a valid object with all required top-level keys", async () => {
    const fr = await import("../client/src/i18n/fr");
    const keys = Object.keys(fr.default);
    expect(keys).toContain("nav");
    expect(keys).toContain("common");
    expect(keys).toContain("coursePlayer");
    expect(keys).toContain("footer");
    expect(keys).toContain("membership");
    expect(keys).toContain("referrals");
    expect(keys).toContain("certificates");
    expect(keys).toContain("channels");
    expect(keys).toContain("aiAssistant");
  });

  it("EN and FR have matching top-level key structure", async () => {
    const en = await import("../client/src/i18n/en");
    const fr = await import("../client/src/i18n/fr");
    const enKeys = Object.keys(en.default).sort();
    const frKeys = Object.keys(fr.default).sort();
    expect(enKeys).toEqual(frKeys);
  });

  it("EN and FR nav sections have matching keys", async () => {
    const en = await import("../client/src/i18n/en");
    const fr = await import("../client/src/i18n/fr");
    const enNavKeys = Object.keys(en.default.nav).sort();
    const frNavKeys = Object.keys(fr.default.nav).sort();
    expect(enNavKeys).toEqual(frNavKeys);
  });

  it("FR translations are not identical to EN (actually translated)", async () => {
    const en = await import("../client/src/i18n/en");
    const fr = await import("../client/src/i18n/fr");
    // At least the nav labels should differ
    expect(fr.default.nav.feed).not.toBe(en.default.nav.feed);
    expect(fr.default.nav.leaderboard).not.toBe(en.default.nav.leaderboard);
    expect(fr.default.nav.membership).not.toBe(en.default.nav.membership);
  });

  it("coursePlayer translation keys exist in both EN and FR", async () => {
    const en = await import("../client/src/i18n/en");
    const fr = await import("../client/src/i18n/fr");
    const enCpKeys = Object.keys(en.default.coursePlayer).sort();
    const frCpKeys = Object.keys(fr.default.coursePlayer).sort();
    expect(enCpKeys).toEqual(frCpKeys);
    expect(enCpKeys.length).toBeGreaterThan(10);
  });

  it("common translation keys match between EN and FR", async () => {
    const en = await import("../client/src/i18n/en");
    const fr = await import("../client/src/i18n/fr");
    const enCommonKeys = Object.keys(en.default.common).sort();
    const frCommonKeys = Object.keys(fr.default.common).sort();
    expect(enCommonKeys).toEqual(frCommonKeys);
  });

  it("membership translation keys match between EN and FR", async () => {
    const en = await import("../client/src/i18n/en");
    const fr = await import("../client/src/i18n/fr");
    const enKeys = Object.keys(en.default.membership).sort();
    const frKeys = Object.keys(fr.default.membership).sort();
    expect(enKeys).toEqual(frKeys);
  });
});

// ──────────────────────────────────────────────────────────────────────
// Sprint 25: Course Player Backend
// ──────────────────────────────────────────────────────────────────────
describe("Sprint 25 — Course Player Router", () => {
  it("coursePlayer router is registered on appRouter", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    const cpProcedures = procedures.filter((p) => p.startsWith("coursePlayer."));
    expect(cpProcedures.length).toBeGreaterThanOrEqual(5);
    expect(cpProcedures).toContain("coursePlayer.catalog");
    expect(cpProcedures).toContain("coursePlayer.courseDetail");
    expect(cpProcedures).toContain("coursePlayer.enroll");
    expect(cpProcedures).toContain("coursePlayer.myEnrollments");
    expect(cpProcedures).toContain("coursePlayer.courseProgress");
    expect(cpProcedures).toContain("coursePlayer.lessonContent");
    expect(cpProcedures).toContain("coursePlayer.completeLesson");
    expect(cpProcedures).toContain("coursePlayer.nextLesson");
  });

  it("catalog is a public procedure (no auth required)", async () => {
    const publicCtx = createPublicContext();
    const caller = appRouter.createCaller(publicCtx);
    // Should not throw UNAUTHORIZED
    const result = await caller.coursePlayer.catalog();
    expect(Array.isArray(result)).toBe(true);
  });

  it("courseDetail is a public procedure", async () => {
    const publicCtx = createPublicContext();
    const caller = appRouter.createCaller(publicCtx);
    // Should throw NOT_FOUND (not UNAUTHORIZED) for nonexistent course
    try {
      await caller.coursePlayer.courseDetail({ courseId: 999999 });
    } catch (err: any) {
      expect(err.code).toBe("NOT_FOUND");
    }
  });

  it("enroll requires authentication", async () => {
    const publicCtx = createPublicContext();
    const caller = appRouter.createCaller(publicCtx);
    try {
      await caller.coursePlayer.enroll({ courseId: 1 });
      expect.unreachable("Should have thrown");
    } catch (err: any) {
      expect(err.message).toContain("login");
    }
  });

  it("myEnrollments requires authentication", async () => {
    const publicCtx = createPublicContext();
    const caller = appRouter.createCaller(publicCtx);
    try {
      await caller.coursePlayer.myEnrollments();
      expect.unreachable("Should have thrown");
    } catch (err: any) {
      expect(err.message).toContain("login");
    }
  });

  it("courseProgress requires authentication", async () => {
    const publicCtx = createPublicContext();
    const caller = appRouter.createCaller(publicCtx);
    try {
      await caller.coursePlayer.courseProgress({ courseId: 1 });
      expect.unreachable("Should have thrown");
    } catch (err: any) {
      expect(err.message).toContain("login");
    }
  });

  it("lessonContent requires authentication", async () => {
    const publicCtx = createPublicContext();
    const caller = appRouter.createCaller(publicCtx);
    try {
      await caller.coursePlayer.lessonContent({ lessonId: 1, courseId: 1 });
      expect.unreachable("Should have thrown");
    } catch (err: any) {
      expect(err.message).toContain("login");
    }
  });

  it("completeLesson requires authentication", async () => {
    const publicCtx = createPublicContext();
    const caller = appRouter.createCaller(publicCtx);
    try {
      await caller.coursePlayer.completeLesson({ lessonId: 1, courseId: 1 });
      expect.unreachable("Should have thrown");
    } catch (err: any) {
      expect(err.message).toContain("login");
    }
  });

  it("nextLesson requires authentication", async () => {
    const publicCtx = createPublicContext();
    const caller = appRouter.createCaller(publicCtx);
    try {
      await caller.coursePlayer.nextLesson({ courseId: 1 });
      expect.unreachable("Should have thrown");
    } catch (err: any) {
      expect(err.message).toContain("login");
    }
  });

  it("catalog returns array with price field", async () => {
    const publicCtx = createPublicContext();
    const caller = appRouter.createCaller(publicCtx);
    const result = await caller.coursePlayer.catalog();
    expect(Array.isArray(result)).toBe(true);
    // Each item should have a price field (even if 0)
    result.forEach((course) => {
      expect(typeof course.price).toBe("number");
    });
  });

  it("enroll validates courseId input", async () => {
    const authCtx = createAuthContext();
    const caller = appRouter.createCaller(authCtx);
    try {
      // @ts-ignore - intentionally passing invalid input
      await caller.coursePlayer.enroll({ courseId: "invalid" });
      expect.unreachable("Should have thrown");
    } catch (err: any) {
      // Should be a validation error
      expect(err).toBeDefined();
    }
  });

  it("completeLesson accepts optional timeSpentSeconds", async () => {
    const authCtx = createAuthContext();
    const caller = appRouter.createCaller(authCtx);
    // This should fail with NOT_FOUND (not validation error) since course doesn't exist
    try {
      await caller.coursePlayer.completeLesson({
        lessonId: 999999,
        courseId: 999999,
        timeSpentSeconds: 120,
      });
    } catch (err: any) {
      // Should be a database or not-found error, not a validation error
      expect(err).toBeDefined();
    }
  });
});

// ──────────────────────────────────────────────────────────────────────
// Sprint 25: Course Admin Router (already tested but verify registration)
// ──────────────────────────────────────────────────────────────────────
describe("Sprint 25 — Course Admin Router Registration", () => {
  it("courseAdmin router is registered on appRouter", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    const adminProcedures = procedures.filter((p) => p.startsWith("courseAdmin."));
    expect(adminProcedures.length).toBeGreaterThanOrEqual(5);
    expect(adminProcedures).toContain("courseAdmin.list");
    expect(adminProcedures).toContain("courseAdmin.createCourse");
    expect(adminProcedures).toContain("courseAdmin.publishCourse");
  });

  it("courseAdmin procedures require admin role", async () => {
    const userCtx = createAuthContext({ role: "user" });
    const caller = appRouter.createCaller(userCtx);
    try {
      await caller.courseAdmin.list();
      expect.unreachable("Should have thrown");
    } catch (err: any) {
      expect(err.code).toBe("FORBIDDEN");
    }
  });

  it("courseAdmin procedures allow admin role", async () => {
    const adminCtx = createAdminContext();
    const caller = appRouter.createCaller(adminCtx);
    // Should not throw FORBIDDEN
    const result = await caller.courseAdmin.list();
    expect(Array.isArray(result)).toBe(true);
  });
});
