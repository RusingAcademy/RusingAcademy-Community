/**
 * WebSocket Server — Real-time Notifications & Online Presence
 * Handles: notification delivery, online presence tracking, typing indicators
 */
import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

// ── Types ──────────────────────────────────────────────
interface WSClient {
  ws: WebSocket;
  userId: string;
  userName: string;
  connectedAt: number;
  lastPing: number;
}

interface WSMessage {
  type: "auth" | "ping" | "presence_request" | "typing_start" | "typing_stop";
  payload?: Record<string, unknown>;
}

interface WSOutbound {
  type:
    | "auth_ok"
    | "auth_error"
    | "notification"
    | "presence_update"
    | "presence_list"
    | "typing_indicator"
    | "user_online"
    | "user_offline";
  payload: Record<string, unknown>;
}

// ── State ──────────────────────────────────────────────
const clients = new Map<string, WSClient>(); // userId → client
const HEARTBEAT_INTERVAL = 30_000; // 30s
const HEARTBEAT_TIMEOUT = 45_000; // 45s

// ── Helpers ────────────────────────────────────────────
function broadcast(message: WSOutbound, excludeUserId?: string) {
  const data = JSON.stringify(message);
  for (const [userId, client] of Array.from(clients.entries())) {
    if (userId === excludeUserId) continue;
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  }
}

function sendTo(userId: string, message: WSOutbound) {
  const client = clients.get(userId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message));
  }
}

function getOnlineUsers(): { userId: string; userName: string; connectedAt: number }[] {
  return Array.from(clients.values()).map((c) => ({
    userId: c.userId,
    userName: c.userName,
    connectedAt: c.connectedAt,
  }));
}

// ── Public API ─────────────────────────────────────────

/** Send a notification to a specific user in real-time */
export function notifyUser(
  userId: string,
  notification: {
    id?: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    createdAt?: number;
  }
) {
  sendTo(userId, {
    type: "notification",
    payload: {
      ...notification,
      id: notification.id || `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: notification.createdAt || Date.now(),
    },
  });
}

/** Broadcast a notification to all connected users */
export function broadcastNotification(notification: {
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  broadcast({
    type: "notification",
    payload: {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
    },
  });
}

/** Check if a user is currently online */
export function isUserOnline(userId: string): boolean {
  return clients.has(userId);
}

/** Get count of online users */
export function getOnlineCount(): number {
  return clients.size;
}

// ── Server Setup ───────────────────────────────────────
export function setupWebSocket(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  console.log("[WebSocket] Server initialized on /ws");

  // Heartbeat check
  const heartbeatTimer = setInterval(() => {
    const now = Date.now();
    for (const [userId, client] of Array.from(clients.entries())) {
      if (now - client.lastPing > HEARTBEAT_TIMEOUT) {
        console.log(`[WebSocket] Heartbeat timeout for user ${userId}`);
        client.ws.terminate();
        clients.delete(userId);
        broadcast(
          { type: "user_offline", payload: { userId, userName: client.userName } },
          userId
        );
      }
    }
  }, HEARTBEAT_INTERVAL);

  wss.on("close", () => {
    clearInterval(heartbeatTimer);
  });

  wss.on("connection", (ws) => {
    let authenticatedUserId: string | null = null;

    // Auto-disconnect if not authenticated within 10s
    const authTimeout = setTimeout(() => {
      if (!authenticatedUserId) {
        ws.send(JSON.stringify({ type: "auth_error", payload: { reason: "Authentication timeout" } }));
        ws.close();
      }
    }, 10_000);

    ws.on("message", (raw) => {
      try {
        const msg: WSMessage = JSON.parse(raw.toString());

        switch (msg.type) {
          case "auth": {
            const userId = msg.payload?.userId as string;
            const userName = msg.payload?.userName as string;
            if (!userId || !userName) {
              ws.send(JSON.stringify({ type: "auth_error", payload: { reason: "Missing userId or userName" } }));
              return;
            }

            clearTimeout(authTimeout);
            authenticatedUserId = userId;

            // Close existing connection for this user (single-session)
            const existing = clients.get(userId);
            if (existing) {
              existing.ws.close();
            }

            clients.set(userId, {
              ws,
              userId,
              userName,
              connectedAt: Date.now(),
              lastPing: Date.now(),
            });

            // Send auth confirmation
            ws.send(JSON.stringify({
              type: "auth_ok",
              payload: { userId, onlineCount: clients.size },
            }));

            // Broadcast user online
            broadcast(
              { type: "user_online", payload: { userId, userName } },
              userId
            );

            // Send current online list to the new user
            ws.send(JSON.stringify({
              type: "presence_list",
              payload: { users: getOnlineUsers() },
            }));

            console.log(`[WebSocket] User ${userName} (${userId}) connected. Online: ${clients.size}`);
            break;
          }

          case "ping": {
            if (authenticatedUserId) {
              const client = clients.get(authenticatedUserId);
              if (client) {
                client.lastPing = Date.now();
              }
            }
            break;
          }

          case "presence_request": {
            ws.send(JSON.stringify({
              type: "presence_list",
              payload: { users: getOnlineUsers() },
            }));
            break;
          }

          case "typing_start":
          case "typing_stop": {
            if (!authenticatedUserId) return;
            const conversationId = msg.payload?.conversationId as string;
            if (!conversationId) return;

            // Broadcast typing indicator to the conversation partner
            const targetUserId = msg.payload?.targetUserId as string;
            if (targetUserId) {
              sendTo(targetUserId, {
                type: "typing_indicator",
                payload: {
                  userId: authenticatedUserId,
                  conversationId,
                  isTyping: msg.type === "typing_start",
                },
              });
            }
            break;
          }
        }
      } catch {
        // Ignore malformed messages
      }
    });

    ws.on("close", () => {
      clearTimeout(authTimeout);
      if (authenticatedUserId) {
        const client = clients.get(authenticatedUserId);
        if (client && client.ws === ws) {
          clients.delete(authenticatedUserId);
          broadcast(
            { type: "user_offline", payload: { userId: authenticatedUserId, userName: client.userName } },
            authenticatedUserId
          );
          console.log(`[WebSocket] User ${client.userName} disconnected. Online: ${clients.size}`);
        }
      }
    });

    ws.on("error", () => {
      // Handled by close event
    });
  });

  return wss;
}
