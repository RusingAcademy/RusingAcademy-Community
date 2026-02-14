import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Test Helpers ────────────────────────────────────────────────────
type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@rusingacademy.ca",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: { origin: "https://test.manus.space" } } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: { origin: "https://test.manus.space" } } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: { origin: "https://test.manus.space" } } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

// ─── Sprint 21: Stripe Membership Integration ───────────────────────
describe("Sprint 21 — Stripe Membership", () => {
  it("membership.listTiers returns array of tiers", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const tiers = await caller.membership.listTiers();
    expect(Array.isArray(tiers)).toBe(true);
  });

  it("membership.mySubscription returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    // publicProcedure should return null when no user
    try {
      const sub = await caller.membership.mySubscription();
      expect(sub).toBeNull();
    } catch (err: any) {
      // If it throws UNAUTHORIZED, that's also valid
      expect(err.code).toBe("UNAUTHORIZED");
    }
  });

  it("membership.createCheckoutSession requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    try {
      await caller.membership.createCheckoutSession({ tierId: 1, billingCycle: "monthly" });
      expect.unreachable("Should have thrown");
    } catch (err: any) {
      expect(err.code).toBe("UNAUTHORIZED");
    }
  });

  it("membership.createCheckoutSession requires valid tier", async () => {
    const caller = appRouter.createCaller(createUserContext());
    try {
      await caller.membership.createCheckoutSession({ tierId: 99999, billingCycle: "monthly" });
      expect.unreachable("Should have thrown");
    } catch (err: any) {
      // Should throw NOT_FOUND or similar
      expect(["NOT_FOUND", "BAD_REQUEST", "INTERNAL_SERVER_ERROR"]).toContain(err.code);
    }
  });

  it("membership.createPortalSession requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    try {
      await caller.membership.createPortalSession();
      expect.unreachable("Should have thrown");
    } catch (err: any) {
      expect(err.code).toBe("UNAUTHORIZED");
    }
  });

  it("membership.myPayments requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    try {
      await caller.membership.myPayments({ limit: 5 });
      expect.unreachable("Should have thrown");
    } catch (err: any) {
      expect(err.code).toBe("UNAUTHORIZED");
    }
  });

  it("membership.myPayments returns array for authenticated user", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const payments = await caller.membership.myPayments({ limit: 5 });
    expect(Array.isArray(payments)).toBe(true);
  });
});

// ─── Sprint 22: i18n / Locale ───────────────────────────────────────
describe("Sprint 22 — i18n Translations", () => {
  it("English translations have all required top-level keys", async () => {
    const en = (await import("../client/src/i18n/en")).default;
    expect(en).toHaveProperty("nav");
    expect(en).toHaveProperty("common");
    expect(en).toHaveProperty("feed");
    expect(en).toHaveProperty("membership");
    expect(en).toHaveProperty("referrals");
    expect(en).toHaveProperty("aiAssistant");
    expect(en).toHaveProperty("channels");
    expect(en).toHaveProperty("certificates");
    expect(en).toHaveProperty("courseBuilder");
    expect(en).toHaveProperty("footer");
    expect(en).toHaveProperty("languages");
  });

  it("French translations have all required top-level keys", async () => {
    const fr = (await import("../client/src/i18n/fr")).default;
    expect(fr).toHaveProperty("nav");
    expect(fr).toHaveProperty("common");
    expect(fr).toHaveProperty("feed");
    expect(fr).toHaveProperty("membership");
    expect(fr).toHaveProperty("referrals");
    expect(fr).toHaveProperty("aiAssistant");
    expect(fr).toHaveProperty("channels");
    expect(fr).toHaveProperty("certificates");
    expect(fr).toHaveProperty("courseBuilder");
    expect(fr).toHaveProperty("footer");
    expect(fr).toHaveProperty("languages");
  });

  it("EN and FR translations have matching structure", async () => {
    const en = (await import("../client/src/i18n/en")).default;
    const fr = (await import("../client/src/i18n/fr")).default;

    // Check that every key in EN exists in FR
    for (const section of Object.keys(en) as (keyof typeof en)[]) {
      expect(fr).toHaveProperty(section as string);
      const enSection = en[section];
      const frSection = (fr as any)[section];
      if (typeof enSection === "object" && enSection !== null) {
        for (const key of Object.keys(enSection)) {
          expect(frSection).toHaveProperty(key);
        }
      }
    }
  });

  it("French nav translations are different from English", async () => {
    const en = (await import("../client/src/i18n/en")).default;
    const fr = (await import("../client/src/i18n/fr")).default;
    expect(fr.nav.feed).not.toBe(en.nav.feed);
    expect(fr.nav.channels).not.toBe(en.nav.channels);
    expect(fr.nav.leaderboard).not.toBe(en.nav.leaderboard);
  });

  it("French common translations are different from English", async () => {
    const en = (await import("../client/src/i18n/en")).default;
    const fr = (await import("../client/src/i18n/fr")).default;
    expect(fr.common.loading).not.toBe(en.common.loading);
    expect(fr.common.save).not.toBe(en.common.save);
    expect(fr.common.cancel).not.toBe(en.common.cancel);
    expect(fr.common.search).not.toBe(en.common.search);
  });
});

// ─── Sprint 23: Course Admin ────────────────────────────────────────
describe("Sprint 23 — Course Admin", () => {
  it("courseAdmin.list requires admin role", async () => {
    const caller = appRouter.createCaller(createUserContext());
    try {
      await caller.courseAdmin.list();
      expect.unreachable("Should have thrown");
    } catch (err: any) {
      expect(err.code).toBe("FORBIDDEN");
    }
  });

  it("courseAdmin.list returns array for admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const courses = await caller.courseAdmin.list();
    expect(Array.isArray(courses)).toBe(true);
  });

  it("courseAdmin.get requires admin role", async () => {
    const caller = appRouter.createCaller(createUserContext());
    try {
      await caller.courseAdmin.get({ id: 1 });
      expect.unreachable("Should have thrown");
    } catch (err: any) {
      expect(err.code).toBe("FORBIDDEN");
    }
  });

  it("courseAdmin.createCourse requires admin role", async () => {
    const caller = appRouter.createCaller(createUserContext());
    try {
      await caller.courseAdmin.createCourse({ title: "Test Course" });
      expect.unreachable("Should have thrown");
    } catch (err: any) {
      expect(err.code).toBe("FORBIDDEN");
    }
  });

  it("courseAdmin.updateCourse requires admin role", async () => {
    const caller = appRouter.createCaller(createUserContext());
    try {
      await caller.courseAdmin.updateCourse({ id: 1, title: "Updated" });
      expect.unreachable("Should have thrown");
    } catch (err: any) {
      expect(err.code).toBe("FORBIDDEN");
    }
  });

  it("courseAdmin.deleteCourse requires admin role", async () => {
    const caller = appRouter.createCaller(createUserContext());
    try {
      await caller.courseAdmin.deleteCourse({ id: 1 });
      expect.unreachable("Should have thrown");
    } catch (err: any) {
      expect(err.code).toBe("FORBIDDEN");
    }
  });

  it("courseAdmin.addModule requires admin role", async () => {
    const caller = appRouter.createCaller(createUserContext());
    try {
      await caller.courseAdmin.addModule({ courseId: 1, title: "Module 1" });
      expect.unreachable("Should have thrown");
    } catch (err: any) {
      expect(err.code).toBe("FORBIDDEN");
    }
  });

  it("courseAdmin.addLesson requires admin role", async () => {
    const caller = appRouter.createCaller(createUserContext());
    try {
      await caller.courseAdmin.addLesson({ moduleId: 1, courseId: 1, title: "Lesson 1" });
      expect.unreachable("Should have thrown");
    } catch (err: any) {
      expect(err.code).toBe("FORBIDDEN");
    }
  });

  it("courseAdmin.publishCourse requires admin role", async () => {
    const caller = appRouter.createCaller(createUserContext());
    try {
      await caller.courseAdmin.publishCourse({ id: 1 });
      expect.unreachable("Should have thrown");
    } catch (err: any) {
      expect(err.code).toBe("FORBIDDEN");
    }
  });

  it("courseAdmin.reorderModules requires admin role", async () => {
    const caller = appRouter.createCaller(createUserContext());
    try {
      await caller.courseAdmin.reorderModules({ courseId: 1, moduleIds: [1, 2] });
      expect.unreachable("Should have thrown");
    } catch (err: any) {
      expect(err.code).toBe("FORBIDDEN");
    }
  });

  it("courseAdmin.reorderLessons requires admin role", async () => {
    const caller = appRouter.createCaller(createUserContext());
    try {
      await caller.courseAdmin.reorderLessons({ moduleId: 1, lessonIds: [1, 2] });
      expect.unreachable("Should have thrown");
    } catch (err: any) {
      expect(err.code).toBe("FORBIDDEN");
    }
  });

  it("courseAdmin.deleteModule requires admin role", async () => {
    const caller = appRouter.createCaller(createUserContext());
    try {
      await caller.courseAdmin.deleteModule({ id: 1 });
      expect.unreachable("Should have thrown");
    } catch (err: any) {
      expect(err.code).toBe("FORBIDDEN");
    }
  });

  it("courseAdmin.deleteLesson requires admin role", async () => {
    const caller = appRouter.createCaller(createUserContext());
    try {
      await caller.courseAdmin.deleteLesson({ id: 1 });
      expect.unreachable("Should have thrown");
    } catch (err: any) {
      expect(err.code).toBe("FORBIDDEN");
    }
  });

  it("courseAdmin.updateModule requires admin role", async () => {
    const caller = appRouter.createCaller(createUserContext());
    try {
      await caller.courseAdmin.updateModule({ id: 1, title: "Updated" });
      expect.unreachable("Should have thrown");
    } catch (err: any) {
      expect(err.code).toBe("FORBIDDEN");
    }
  });

  it("courseAdmin.updateLesson requires admin role", async () => {
    const caller = appRouter.createCaller(createUserContext());
    try {
      await caller.courseAdmin.updateLesson({ id: 1, title: "Updated" });
      expect.unreachable("Should have thrown");
    } catch (err: any) {
      expect(err.code).toBe("FORBIDDEN");
    }
  });
});

// ─── Stripe Webhook Route ───────────────────────────────────────────
describe("Sprint 21 — Stripe Webhook", () => {
  it("stripe webhook module exports stripeWebhookRouter", async () => {
    const mod = await import("./stripe/webhook");
    expect(mod).toHaveProperty("stripeWebhookRouter");
  });

  it("stripe client module exports getStripe function", async () => {
    const mod = await import("./stripe/client");
    expect(mod).toHaveProperty("getStripe");
    expect(typeof mod.getStripe).toBe("function");
  });

  it("stripe products module exports TIER_PRICING", async () => {
    const mod = await import("./stripe/products");
    expect(mod).toHaveProperty("TIER_PRICING");
    expect(Array.isArray(mod.TIER_PRICING)).toBe(true);
    expect(mod.TIER_PRICING.length).toBeGreaterThan(0);
  });
});
