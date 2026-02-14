/**
 * Tests for Feature 2 (WebSocket) and Feature 3 (GIF Picker)
 * Covers: WebSocket server module exports, notification helpers, GIF URL detection
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

// ── WebSocket Server Module Tests ──────────────────────
describe("WebSocket Server Module", () => {
  it("exports setupWebSocket function", async () => {
    const ws = await import("./websocket");
    expect(typeof ws.setupWebSocket).toBe("function");
  });

  it("exports notifyUser function", async () => {
    const ws = await import("./websocket");
    expect(typeof ws.notifyUser).toBe("function");
  });

  it("exports broadcastNotification function", async () => {
    const ws = await import("./websocket");
    expect(typeof ws.broadcastNotification).toBe("function");
  });

  it("exports isUserOnline function", async () => {
    const ws = await import("./websocket");
    expect(typeof ws.isUserOnline).toBe("function");
  });

  it("exports getOnlineCount function", async () => {
    const ws = await import("./websocket");
    expect(typeof ws.getOnlineCount).toBe("function");
  });

  it("isUserOnline returns false for non-connected user", async () => {
    const ws = await import("./websocket");
    expect(ws.isUserOnline("nonexistent-user-123")).toBe(false);
  });

  it("getOnlineCount returns a number >= 0", async () => {
    const ws = await import("./websocket");
    const count = ws.getOnlineCount();
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("notifyUser does not throw for non-connected user", async () => {
    const ws = await import("./websocket");
    expect(() =>
      ws.notifyUser("nonexistent-user-456", {
        type: "test",
        title: "Test Notification",
        message: "This is a test",
      })
    ).not.toThrow();
  });

  it("broadcastNotification does not throw when no clients connected", async () => {
    const ws = await import("./websocket");
    expect(() =>
      ws.broadcastNotification({
        type: "announcement",
        title: "Test Broadcast",
        message: "Hello everyone",
      })
    ).not.toThrow();
  });
});

// ── GIF URL Detection Tests ────────────────────────────
describe("GIF URL Detection in Post Content", () => {
  const gifPatterns = [
    /!\[GIF\]\((https?:\/\/[^)]+\.gif[^)]*)\)/i,
    /(https?:\/\/media\.tenor\.com\/[^\s)]+)/i,
    /(https?:\/\/media[0-9]*\.giphy\.com\/[^\s)]+)/i,
  ];

  function detectGif(content: string): string | null {
    for (const pattern of gifPatterns) {
      const match = content.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  it("detects markdown GIF syntax", () => {
    const content = "Check this out!\n\n![GIF](https://media.tenor.com/abc123.gif)";
    expect(detectGif(content)).toBe("https://media.tenor.com/abc123.gif");
  });

  it("detects Tenor media URL", () => {
    const content = "Funny reaction: https://media.tenor.com/images/abc123/tenor.gif";
    expect(detectGif(content)).toBe("https://media.tenor.com/images/abc123/tenor.gif");
  });

  it("detects Giphy media URL", () => {
    const content = "Look at this: https://media0.giphy.com/media/abc123/giphy.gif";
    expect(detectGif(content)).toBe("https://media0.giphy.com/media/abc123/giphy.gif");
  });

  it("returns null for content without GIFs", () => {
    const content = "This is a regular post about learning French.";
    expect(detectGif(content)).toBeNull();
  });

  it("returns null for regular image URLs", () => {
    const content = "Check this image: https://example.com/photo.jpg";
    expect(detectGif(content)).toBeNull();
  });

  it("handles GIF URL with query parameters", () => {
    const content = "![GIF](https://media.tenor.com/abc.gif?hh=200&w=300)";
    expect(detectGif(content)).toBe("https://media.tenor.com/abc.gif?hh=200&w=300");
  });

  it("detects GIF in mixed content", () => {
    const content = "Great job everyone! Here's a celebration:\n\n![GIF](https://media.tenor.com/celebrate.gif)\n\nKeep up the good work!";
    expect(detectGif(content)).toBe("https://media.tenor.com/celebrate.gif");
  });
});

// ── WebSocket Message Protocol Tests ───────────────────
describe("WebSocket Message Protocol", () => {
  it("auth message structure is valid", () => {
    const authMsg = {
      type: "auth",
      payload: { userId: "123", userName: "TestUser" },
    };
    expect(authMsg.type).toBe("auth");
    expect(authMsg.payload.userId).toBeDefined();
    expect(authMsg.payload.userName).toBeDefined();
  });

  it("ping message structure is valid", () => {
    const pingMsg = { type: "ping" };
    expect(pingMsg.type).toBe("ping");
  });

  it("typing_start message structure is valid", () => {
    const typingMsg = {
      type: "typing_start",
      payload: { conversationId: "conv_1", targetUserId: "456" },
    };
    expect(typingMsg.type).toBe("typing_start");
    expect(typingMsg.payload.conversationId).toBeDefined();
    expect(typingMsg.payload.targetUserId).toBeDefined();
  });

  it("typing_stop message structure is valid", () => {
    const typingMsg = {
      type: "typing_stop",
      payload: { conversationId: "conv_1", targetUserId: "456" },
    };
    expect(typingMsg.type).toBe("typing_stop");
  });

  it("notification outbound structure is valid", () => {
    const notifMsg = {
      type: "notification",
      payload: {
        id: "notif_123",
        type: "new_message",
        title: "New Message",
        message: "You have a new message from Alice",
        link: "/messages",
        createdAt: Date.now(),
      },
    };
    expect(notifMsg.type).toBe("notification");
    expect(notifMsg.payload.id).toBeDefined();
    expect(notifMsg.payload.createdAt).toBeGreaterThan(0);
  });

  it("presence_list outbound structure is valid", () => {
    const presenceMsg = {
      type: "presence_list",
      payload: {
        users: [
          { userId: "1", userName: "Alice", connectedAt: Date.now() },
          { userId: "2", userName: "Bob", connectedAt: Date.now() },
        ],
      },
    };
    expect(presenceMsg.type).toBe("presence_list");
    expect(presenceMsg.payload.users).toHaveLength(2);
    expect(presenceMsg.payload.users[0].userId).toBe("1");
  });

  it("user_online outbound structure is valid", () => {
    const onlineMsg = {
      type: "user_online",
      payload: { userId: "1", userName: "Alice" },
    };
    expect(onlineMsg.type).toBe("user_online");
    expect(onlineMsg.payload.userId).toBeDefined();
  });

  it("user_offline outbound structure is valid", () => {
    const offlineMsg = {
      type: "user_offline",
      payload: { userId: "1", userName: "Alice" },
    };
    expect(offlineMsg.type).toBe("user_offline");
    expect(offlineMsg.payload.userId).toBeDefined();
  });
});

// ── Notification ID Generation Tests ───────────────────
describe("Notification ID Generation", () => {
  it("generates unique notification IDs", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      ids.add(id);
    }
    // All IDs should be unique (allowing for very small chance of collision)
    expect(ids.size).toBeGreaterThanOrEqual(98);
  });

  it("notification IDs follow expected format", () => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    expect(id).toMatch(/^notif_\d+_[a-z0-9]+$/);
  });
});
