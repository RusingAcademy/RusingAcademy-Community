import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ── Test Helpers ──────────────────────────────────────────────

function createMockUser(overrides: Partial<NonNullable<TrpcContext["user"]>> = {}) {
  return {
    id: 1,
    openId: "test-user-001",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user" as const,
    avatarUrl: null,
    preferredLanguage: "en" as const,
    bio: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

function createMockAdminUser() {
  return createMockUser({ id: 99, openId: "admin-001", name: "Admin User", role: "admin" });
}

function createAuthContext(user?: NonNullable<TrpcContext["user"]>): TrpcContext {
  return {
    user: user ?? createMockUser(),
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ── Router Structure (Sprint 11-20) ──────────────────────────

describe("Sprint 11-20 Router Structure", () => {
  it("appRouter has all Sprint 11-20 sub-routers", () => {
    const caller = appRouter.createCaller(createPublicContext());
    expect(caller.membership).toBeDefined();
    expect(caller.contentAccess).toBeDefined();
    expect(caller.referral).toBeDefined();
    expect(caller.emailBroadcast).toBeDefined();
    expect(caller.certificate).toBeDefined();
    expect(caller.aiAssistant).toBeDefined();
    expect(caller.channel).toBeDefined();
    expect(caller.advancedAnalytics).toBeDefined();
  });
});

// ── Sprint 11: Membership & Tiers ────────────────────────────

describe("membership", () => {
  it("listTiers returns an array of tiers (public)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.membership.listTiers();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("listTiers returns tiers with expected fields", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.membership.listTiers();
    if (result.length > 0) {
      const tier = result[0];
      expect(tier).toHaveProperty("name");
      expect(tier).toHaveProperty("slug");
      expect(tier).toHaveProperty("priceMonthly");
      expect(tier).toHaveProperty("features");
    }
  });

  it("mySubscription requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.membership.mySubscription()).rejects.toThrow();
  });

  it("mySubscription returns null or subscription for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.membership.mySubscription();
    // Could be null (no subscription) or an object
    expect(result === null || typeof result === "object").toBe(true);
  });

  it("subscribe requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.membership.subscribe({ tierId: 1, billingCycle: "monthly" })
    ).rejects.toThrow();
  });

  it("cancelSubscription requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.membership.cancelSubscription()).rejects.toThrow();
  });

  it("revenueOverview requires admin role", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockUser()));
    await expect(caller.membership.revenueOverview()).rejects.toThrow();
  });

  it("revenueOverview works for admin", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockAdminUser()));
    const result = await caller.membership.revenueOverview();
    expect(result).toHaveProperty("totalRevenue");
    expect(result).toHaveProperty("activeSubscriptions");
  });
});

// ── Sprint 12: Content Access / Gating ───────────────────────

describe("contentAccess", () => {
  it("checkAccess requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.contentAccess.checkAccess({ contentType: "course", contentId: 1 })
    ).rejects.toThrow();
  });

  it("checkAccess returns access status for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.contentAccess.checkAccess({ contentType: "course", contentId: 1 });
    expect(result).toHaveProperty("hasAccess");
    expect(typeof result.hasAccess).toBe("boolean");
  });

  it("listRules requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.contentAccess.listRules()).rejects.toThrow();
  });

  it("getDripSchedule requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.contentAccess.getDripSchedule({ courseId: 1 })
    ).rejects.toThrow();
  });
});

// ── Sprint 13: Referral Program ──────────────────────────────

describe("referral", () => {
  it("myReferralCode requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.referral.myReferralCode()).rejects.toThrow();
  });

  it("myReferralCode returns a referral code for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.referral.myReferralCode();
    expect(result).toHaveProperty("referralCode");
    expect(typeof result.referralCode).toBe("string");
    expect(result.referralCode.length).toBeGreaterThan(0);
  });

  it("myReferralStats requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.referral.myReferralStats()).rejects.toThrow();
  });

  it("myReferralStats returns stats for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.referral.myReferralStats();
    expect(result).toHaveProperty("totalClicks");
    expect(result).toHaveProperty("totalReferrals");
    expect(result).toHaveProperty("conversions");
    expect(result).toHaveProperty("totalCommission");
    expect(result).toHaveProperty("pendingCommission");
  });

  it("myReferrals requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.referral.myReferrals()).rejects.toThrow();
  });

  it("trackClick is public and accepts a referral code", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.referral.trackClick({ code: "nonexistent-code" });
    expect(result).toHaveProperty("success");
  });

  it("registerReferral requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.referral.registerReferral({ code: "TEST" })).rejects.toThrow();
  });
});

// ── Sprint 14: Email Broadcast ───────────────────────────────

describe("emailBroadcast", () => {
  it("list requires admin role", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockUser()));
    await expect(caller.emailBroadcast.list()).rejects.toThrow();
  });

  it("list returns broadcasts for admin", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockAdminUser()));
    const result = await caller.emailBroadcast.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("stats requires admin role", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockUser()));
    await expect(caller.emailBroadcast.stats()).rejects.toThrow();
  });

  it("stats returns metrics for admin", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockAdminUser()));
    const result = await caller.emailBroadcast.stats();
    expect(result).toHaveProperty("totalSent");
    expect(result).toHaveProperty("totalDrafts");
    expect(result).toHaveProperty("totalRecipients");
    expect(result).toHaveProperty("avgOpenRate");
  });

  it("create requires admin role", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockUser()));
    await expect(
      caller.emailBroadcast.create({ subject: "Test", body: "Test body" })
    ).rejects.toThrow();
  });

  it("send requires admin role", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockUser()));
    await expect(caller.emailBroadcast.send({ id: 1 })).rejects.toThrow();
  });

  it("delete requires admin role", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockUser()));
    await expect(caller.emailBroadcast.delete({ id: 1 })).rejects.toThrow();
  });
});

// ── Sprint 15: Certificates ─────────────────────────────────

describe("certificate", () => {
  it("myCertificates requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.certificate.myCertificates()).rejects.toThrow();
  });

  it("myCertificates returns an array for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.certificate.myCertificates();
    expect(Array.isArray(result)).toBe(true);
  });

  it("verify is public and returns null for non-existent certificate", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.certificate.verify({ certificateNumber: "NONEXISTENT-000" });
    expect(result).toBeNull();
  });

  it("issueCertificate requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.certificate.issueCertificate({ courseId: 1 })
    ).rejects.toThrow();
  });
});

// ── Sprint 16: AI Writing Assistant ──────────────────────────

describe("aiAssistant", () => {
  it("correctWriting requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.aiAssistant.correctWriting({ text: "This is a test", language: "en" })
    ).rejects.toThrow();
  });

  it("myHistory requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.aiAssistant.myHistory()).rejects.toThrow();
  });

  it("myHistory returns an array for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.aiAssistant.myHistory();
    expect(Array.isArray(result)).toBe(true);
  });

  it("myProgress requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.aiAssistant.myProgress()).rejects.toThrow();
  });

  it("myProgress returns progress stats for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.aiAssistant.myProgress();
    expect(result).toHaveProperty("totalCorrections");
    expect(result).toHaveProperty("avgGrammarScore");
    expect(result).toHaveProperty("avgStyleScore");
    expect(result).toHaveProperty("currentLevel");
  });
});

// ── Sprint 19: Channels ─────────────────────────────────────

describe("channel", () => {
  it("list returns an array of channels (public)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.channel.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("list returns channels with expected fields", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.channel.list();
    if (result.length > 0) {
      const channel = result[0];
      expect(channel).toHaveProperty("name");
      expect(channel).toHaveProperty("slug");
      expect(channel).toHaveProperty("visibility");
      expect(channel).toHaveProperty("memberCount");
    }
  });

  it("myChannels requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.channel.myChannels()).rejects.toThrow();
  });

  it("myChannels returns an array for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.channel.myChannels();
    expect(Array.isArray(result)).toBe(true);
  });

  it("join requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.channel.join({ channelId: 1 })).rejects.toThrow();
  });

  it("leave requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.channel.leave({ channelId: 1 })).rejects.toThrow();
  });

  it("adminCreate requires admin role", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockUser()));
    await expect(
      caller.channel.adminCreate({
        name: "Test Channel",
        slug: "test-channel",
        description: "A test channel",
        visibility: "public",
      })
    ).rejects.toThrow();
  });
});

// ── Sprint 18: Advanced Analytics ────────────────────────────

describe("advancedAnalytics", () => {
  it("revenueDashboard requires admin role", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockUser()));
    await expect(caller.advancedAnalytics.revenueDashboard({ days: 30 })).rejects.toThrow();
  });

  it("revenueDashboard returns data for admin", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockAdminUser()));
    const result = await caller.advancedAnalytics.revenueDashboard({ days: 30 });
    expect(result).toHaveProperty("totalRevenue");
    expect(result).toHaveProperty("mrr");
    expect(result).toHaveProperty("arr");
    expect(result).toHaveProperty("churnRate");
    expect(result).toHaveProperty("tierBreakdown");
  });

  it("engagementMetrics requires admin role", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockUser()));
    await expect(caller.advancedAnalytics.engagementMetrics({ days: 30 })).rejects.toThrow();
  });

  it("engagementMetrics returns data for admin", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockAdminUser()));
    const result = await caller.advancedAnalytics.engagementMetrics({ days: 30 });
    expect(result).toHaveProperty("activeUsers");
    expect(result).toHaveProperty("newUsers");
    expect(result).toHaveProperty("postsCreated");
    expect(result).toHaveProperty("retentionRate");
  });

  it("contentPerformance requires admin role", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockUser()));
    await expect(caller.advancedAnalytics.contentPerformance()).rejects.toThrow();
  });

  it("contentPerformance returns data for admin", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockAdminUser()));
    const result = await caller.advancedAnalytics.contentPerformance();
    expect(result).toHaveProperty("topCourses");
    expect(result).toHaveProperty("topThreads");
    expect(Array.isArray(result.topCourses)).toBe(true);
    expect(Array.isArray(result.topThreads)).toBe(true);
  });

  it("referralAnalytics requires admin role", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockUser()));
    await expect(caller.advancedAnalytics.referralAnalytics()).rejects.toThrow();
  });

  it("referralAnalytics returns data for admin", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockAdminUser()));
    const result = await caller.advancedAnalytics.referralAnalytics();
    expect(result).toHaveProperty("totalReferrals");
    expect(result).toHaveProperty("totalConversions");
    expect(result).toHaveProperty("totalClicks");
    expect(result).toHaveProperty("totalCommissions");
  });
});
