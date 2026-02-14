import { describe, expect, it, vi, beforeAll } from "vitest";
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
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ── Router Structure Tests ────────────────────────────────────

describe("Router structure", () => {
  it("appRouter has all expected sub-routers", () => {
    const caller = appRouter.createCaller(createPublicContext());

    // Verify all routers exist by checking the caller has the expected properties
    expect(caller.auth).toBeDefined();
    expect(caller.forum).toBeDefined();
    expect(caller.gamification).toBeDefined();
    expect(caller.events).toBeDefined();
    expect(caller.challenges).toBeDefined();
    expect(caller.classroom).toBeDefined();
    expect(caller.notebook).toBeDefined();
    expect(caller.notifications).toBeDefined();
    expect(caller.dm).toBeDefined();
    expect(caller.search).toBeDefined();
    expect(caller.polls).toBeDefined();
    expect(caller.moderation).toBeDefined();
    expect(caller.analytics).toBeDefined();
  });
});

// ── Auth Tests ────────────────────────────────────────────────

describe("auth.me", () => {
  it("returns null for unauthenticated users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user data for authenticated users", async () => {
    const user = createMockUser();
    const caller = appRouter.createCaller(createAuthContext(user));
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.openId).toBe("test-user-001");
    expect(result?.name).toBe("Test User");
  });
});

// ── Forum Tests ───────────────────────────────────────────────

describe("forum", () => {
  it("listCategories returns an array (empty when no DB data)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.forum.listCategories();
    expect(Array.isArray(result)).toBe(true);
  });

  it("listThreads returns threads and total count", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.forum.listThreads({ limit: 10, offset: 0 });
    expect(result).toHaveProperty("threads");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.threads)).toBe(true);
    expect(typeof result.total).toBe("number");
  });

  it("listThreads accepts contentType filter", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.forum.listThreads({ contentType: "podcast", limit: 5, offset: 0 });
    expect(result).toHaveProperty("threads");
  });

  it("getThread returns null for non-existent thread", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.forum.getThread({ id: 999999 });
    expect(result).toBeNull();
  });

  it("listComments returns an array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.forum.listComments({ threadId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("createThread requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.forum.createThread({
        title: "Test Thread",
        content: "This is a test thread content",
        contentType: "article",
        categoryId: 1,
      })
    ).rejects.toThrow();
  });

  it("addComment requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.forum.addComment({ threadId: 1, content: "Test comment" })
    ).rejects.toThrow();
  });

  it("toggleThreadLike requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.forum.toggleThreadLike({ threadId: 1 })).rejects.toThrow();
  });

  it("getUserLikes requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.forum.getUserLikes()).rejects.toThrow();
  });

  it("updateThread requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.forum.updateThread({ id: 1, title: "Updated Title" })
    ).rejects.toThrow();
  });

  it("deleteThread requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.forum.deleteThread({ id: 1 })).rejects.toThrow();
  });

  it("restoreThread requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.forum.restoreThread({ id: 1 })).rejects.toThrow();
  });

  it("toggleCommentLike requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.forum.toggleCommentLike({ postId: 1 })).rejects.toThrow();
  });

  it("editComment requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.forum.editComment({ id: 1, content: "Updated comment" })
    ).rejects.toThrow();
  });

  it("deleteComment requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.forum.deleteComment({ id: 1 })).rejects.toThrow();
  });

  it("getThread returns thread data for existing thread", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const threads = await caller.forum.listThreads({ limit: 1, offset: 0 });
    if (threads.threads.length > 0) {
      const thread = await caller.forum.getThread({ id: threads.threads[0].id });
      expect(thread).toBeDefined();
      expect(thread).toHaveProperty("title");
      expect(thread).toHaveProperty("content");
      expect(thread).toHaveProperty("authorName");
    }
  });
});

// ── Gamification Tests ────────────────────────────────────────

describe("gamification", () => {
  it("leaderboard returns an array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.gamification.leaderboard({ period: "weekly", limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("leaderboard supports different periods", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const weekly = await caller.gamification.leaderboard({ period: "weekly", limit: 5 });
    const monthly = await caller.gamification.leaderboard({ period: "monthly", limit: 5 });
    const allTime = await caller.gamification.leaderboard({ period: "all_time", limit: 5 });
    expect(Array.isArray(weekly)).toBe(true);
    expect(Array.isArray(monthly)).toBe(true);
    expect(Array.isArray(allTime)).toBe(true);
  });

  it("myStats requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.gamification.myStats()).rejects.toThrow();
  });

  it("myStats returns stats for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.gamification.myStats();
    expect(result).toBeDefined();
    expect(result).toHaveProperty("totalXp");
    expect(result).toHaveProperty("currentLevel");
  });

  it("myBadges requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.gamification.myBadges()).rejects.toThrow();
  });
});

// ── Events Tests ──────────────────────────────────────────────

describe("events", () => {
  it("list returns events and total count", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.events.list({ limit: 10, offset: 0 });
    expect(result).toHaveProperty("events");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.events)).toBe(true);
  });

  it("get returns null for non-existent event", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.events.get({ id: 999999 });
    expect(result).toBeNull();
  });

  it("register requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.events.register({ eventId: 1 })).rejects.toThrow();
  });

  it("myRegistrations requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.events.myRegistrations()).rejects.toThrow();
  });

  it("create requires admin role", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockUser()));
    await expect(
      caller.events.create({
        title: "Test Event",
        description: "Test event description",
        startAt: new Date(),
        endAt: new Date(),
      })
    ).rejects.toThrow();
  });
});

// ── Challenges Tests ──────────────────────────────────────────

describe("challenges", () => {
  it("list returns an array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.challenges.list({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("get returns null for non-existent challenge", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.challenges.get({ id: 999999 });
    expect(result).toBeNull();
  });

  it("join requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.challenges.join({ challengeId: 1 })).rejects.toThrow();
  });

  it("myChallenges requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.challenges.myChallenges()).rejects.toThrow();
  });

  it("create requires admin role", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockUser()));
    await expect(
      caller.challenges.create({
        name: "Test Challenge",
        type: "posts",
        targetCount: 5,
        pointsReward: 100,
        period: "weekly",
      })
    ).rejects.toThrow();
  });
});

// ── Classroom Tests ───────────────────────────────────────────

describe("classroom", () => {
  it("listCourses returns courses and total count", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.classroom.listCourses({ limit: 10, offset: 0 });
    expect(result).toHaveProperty("courses");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.courses)).toBe(true);
  });

  it("getCourse returns null for non-existent course", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.classroom.getCourse({ id: 999999 });
    expect(result).toBeNull();
  });

  it("enroll requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.classroom.enroll({ courseId: 1 })).rejects.toThrow();
  });

  it("myEnrollments requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.classroom.myEnrollments()).rejects.toThrow();
  });

  it("completeLesson requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.classroom.completeLesson({ lessonId: 1, courseId: 1, moduleId: 1 })
    ).rejects.toThrow();
  });
});

// ── Notebook Tests ────────────────────────────────────────────

describe("notebook", () => {
  it("list returns entries and total count", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.notebook.list({ limit: 10, offset: 0 });
    expect(result).toHaveProperty("entries");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.entries)).toBe(true);
  });

  it("list supports language filter", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.notebook.list({ language: "french", limit: 5, offset: 0 });
    expect(result).toHaveProperty("entries");
  });

  it("get returns null for non-existent entry", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.notebook.get({ id: 999999 });
    expect(result).toBeNull();
  });

  it("create requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.notebook.create({
        title: "Test Entry",
        content: "This is a test notebook entry for correction",
        language: "french",
      })
    ).rejects.toThrow();
  });

  it("addCorrection requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.notebook.addCorrection({ entryId: 1, correctedContent: "Corrected text" })
    ).rejects.toThrow();
  });

  it("myEntries requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.notebook.myEntries()).rejects.toThrow();
  });
});

// ── Notifications Tests ───────────────────────────────────────

describe("notifications", () => {
  it("list requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.notifications.list({ limit: 10, offset: 0 })).rejects.toThrow();
  });

  it("list returns notifications and unread count for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.notifications.list({ limit: 10, offset: 0 });
    expect(result).toHaveProperty("notifications");
    expect(result).toHaveProperty("unreadCount");
    expect(Array.isArray(result.notifications)).toBe(true);
  });

  it("markAllRead requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.notifications.markAllRead()).rejects.toThrow();
  });

  it("markRead requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.notifications.markRead({ id: 1 })).rejects.toThrow();
  });
});

// ── DM Tests ─────────────────────────────────────────────────

describe("dm", () => {
  it("listConversations requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.dm.listConversations()).rejects.toThrow();
  });

  it("listConversations returns an array for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.dm.listConversations();
    expect(Array.isArray(result)).toBe(true);
  });

  it("getMessages requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.dm.getMessages({ conversationId: 1, limit: 20, offset: 0 })).rejects.toThrow();
  });

  it("sendMessage requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.dm.sendMessage({ recipientId: 2, content: "Hello" })
    ).rejects.toThrow();
  });

  it("markConversationRead requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.dm.markConversationRead({ conversationId: 1 })).rejects.toThrow();
  });
});

// ── Search Tests ─────────────────────────────────────────────

describe("search", () => {
  it("search returns results for all categories", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.search.search({ query: "French", limit: 5 });
    expect(result).toHaveProperty("posts");
    expect(result).toHaveProperty("courses");
    expect(result).toHaveProperty("events");
    expect(result).toHaveProperty("members");
    expect(Array.isArray(result.posts)).toBe(true);
    expect(Array.isArray(result.courses)).toBe(true);
    expect(Array.isArray(result.events)).toBe(true);
    expect(Array.isArray(result.members)).toBe(true);
  });
});

// ── Polls Tests ──────────────────────────────────────────────

describe("polls", () => {
  it("getByThread returns null for non-existent poll", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.polls.getByThread({ threadId: 999999 });
    expect(result).toBeNull();
  });

  it("create requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.polls.create({
        threadId: 1,
        question: "Test poll?",
        options: ["Option A", "Option B"],
      })
    ).rejects.toThrow();
  });

  it("vote requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.polls.vote({ pollId: 1, optionIndex: 0 })
    ).rejects.toThrow();
  });
});

// ── Moderation Tests ─────────────────────────────────────────

describe("moderation", () => {
  it("reportContent requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.moderation.reportContent({
        contentType: "thread",
        contentId: 1,
        reason: "spam",
      })
    ).rejects.toThrow();
  });

  it("listReports requires admin role", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockUser()));
    await expect(
      caller.moderation.listReports({ status: "pending", limit: 10, offset: 0 })
    ).rejects.toThrow();
  });

  it("listReports works for admin", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockAdminUser()));
    const result = await caller.moderation.listReports({ status: "pending", limit: 10, offset: 0 });
    expect(result).toHaveProperty("reports");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.reports)).toBe(true);
  });

  it("resolveReport requires admin role", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockUser()));
    await expect(
      caller.moderation.resolveReport({ id: 1, action: "dismiss" })
    ).rejects.toThrow();
  });

  it("suspendUser requires admin role", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockUser()));
    await expect(
      caller.moderation.suspendUser({ userId: 2, reason: "Violation", durationDays: 7 })
    ).rejects.toThrow();
  });

  it("listSuspensions requires admin role", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockUser()));
    await expect(
      caller.moderation.listSuspensions({ limit: 10, offset: 0 })
    ).rejects.toThrow();
  });

  it("listSuspensions works for admin and returns an array", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockAdminUser()));
    const result = await caller.moderation.listSuspensions({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });
});

// ── Analytics Tests ──────────────────────────────────────────

describe("analytics", () => {
  it("overview requires admin role", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockUser()));
    await expect(caller.analytics.overview()).rejects.toThrow();
  });

  it("overview returns stats for admin", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockAdminUser()));
    const result = await caller.analytics.overview();
    expect(result).toHaveProperty("totalMembers");
    expect(result).toHaveProperty("totalPosts");
    expect(result).toHaveProperty("totalComments");
    expect(result).toHaveProperty("totalEnrollments");
    expect(typeof result.totalMembers).toBe("number");
  });

  it("activityTimeline requires admin role", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockUser()));
    await expect(caller.analytics.activityTimeline()).rejects.toThrow();
  });

  it("activityTimeline returns data for admin", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockAdminUser()));
    const result = await caller.analytics.activityTimeline();
    expect(Array.isArray(result)).toBe(true);
  });

  it("topContributors requires admin role", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockUser()));
    await expect(caller.analytics.topContributors()).rejects.toThrow();
  });

  it("topContributors returns data for admin", async () => {
    const caller = appRouter.createCaller(createAuthContext(createMockAdminUser()));
    const result = await caller.analytics.topContributors();
    expect(Array.isArray(result)).toBe(true);
  });
});
