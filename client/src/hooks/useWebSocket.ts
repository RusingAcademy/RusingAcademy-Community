/**
 * useWebSocket — Client-side hook for real-time notifications & online presence
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

// ── Types ──────────────────────────────────────────────
interface OnlineUser {
  userId: string;
  userName: string;
  connectedAt: number;
}

interface RealtimeNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  createdAt: number;
}

interface TypingIndicator {
  userId: string;
  conversationId: string;
  isTyping: boolean;
}

interface WSState {
  connected: boolean;
  onlineUsers: OnlineUser[];
  notifications: RealtimeNotification[];
  typingIndicators: Map<string, TypingIndicator>;
}

// ── Singleton state (shared across components) ─────────
let globalWs: WebSocket | null = null;
let globalState: WSState = {
  connected: false,
  onlineUsers: [],
  notifications: [],
  typingIndicators: new Map<string, TypingIndicator>(),
};
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

function getWsUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
}

// ── Hook ───────────────────────────────────────────────
export function useWebSocket() {
  const { user, isAuthenticated } = useAuth();
  const [, forceUpdate] = useState(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pingTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const reconnectAttempts = useRef(0);

  // Subscribe to global state changes
  useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  // Connect/disconnect based on auth state
  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Disconnect if not authenticated
      if (globalWs) {
        globalWs.close();
        globalWs = null;
        globalState = { ...globalState, connected: false, onlineUsers: [] };
        notifyListeners();
      }
      return;
    }

    // Already connected for this user
    if (globalWs && globalWs.readyState === WebSocket.OPEN) {
      return;
    }

    function connect() {
      if (globalWs && globalWs.readyState !== WebSocket.CLOSED) {
        return;
      }

      const ws = new WebSocket(getWsUrl());
      globalWs = ws;

      ws.onopen = () => {
        reconnectAttempts.current = 0;
        // Authenticate
        ws.send(
          JSON.stringify({
            type: "auth",
            payload: { userId: String(user!.id), userName: user!.name || "User" },
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          switch (msg.type) {
            case "auth_ok":
              globalState = { ...globalState, connected: true };
              notifyListeners();
              // Start heartbeat
              if (pingTimer.current) clearInterval(pingTimer.current);
              pingTimer.current = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ type: "ping" }));
                }
              }, 25_000);
              break;

            case "presence_list":
              globalState = {
                ...globalState,
                onlineUsers: msg.payload.users || [],
              };
              notifyListeners();
              break;

            case "user_online": {
              const newUser: OnlineUser = {
                userId: msg.payload.userId,
                userName: msg.payload.userName,
                connectedAt: Date.now(),
              };
              const exists = globalState.onlineUsers.some(
                (u) => u.userId === newUser.userId
              );
              if (!exists) {
                globalState = {
                  ...globalState,
                  onlineUsers: [...globalState.onlineUsers, newUser],
                };
                notifyListeners();
              }
              break;
            }

            case "user_offline":
              globalState = {
                ...globalState,
                onlineUsers: globalState.onlineUsers.filter(
                  (u) => u.userId !== msg.payload.userId
                ),
              };
              notifyListeners();
              break;

            case "notification": {
              const notif: RealtimeNotification = msg.payload;
              globalState = {
                ...globalState,
                notifications: [notif, ...globalState.notifications].slice(0, 50),
              };
              notifyListeners();
              break;
            }

            case "typing_indicator": {
              const indicator: TypingIndicator = msg.payload;
              const newMap = new Map<string, TypingIndicator>(globalState.typingIndicators);
              if (indicator.isTyping) {
                newMap.set(
                  `${indicator.userId}_${indicator.conversationId}`,
                  indicator
                );
              } else {
                newMap.delete(
                  `${indicator.userId}_${indicator.conversationId}`
                );
              }
              globalState = { ...globalState, typingIndicators: newMap };
              notifyListeners();
              break;
            }
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (pingTimer.current) clearInterval(pingTimer.current);
        globalState = { ...globalState, connected: false };
        notifyListeners();

        // Exponential backoff reconnect
        const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30_000);
        reconnectAttempts.current++;
        reconnectTimer.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        // Will trigger onclose
      };
    }

    connect();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (pingTimer.current) clearInterval(pingTimer.current);
    };
  }, [isAuthenticated, user?.id]);

  // ── Actions ────────────────────────────────────────
  const sendTypingStart = useCallback(
    (conversationId: string, targetUserId: string) => {
      if (globalWs?.readyState === WebSocket.OPEN) {
        globalWs.send(
          JSON.stringify({
            type: "typing_start",
            payload: { conversationId, targetUserId },
          })
        );
      }
    },
    []
  );

  const sendTypingStop = useCallback(
    (conversationId: string, targetUserId: string) => {
      if (globalWs?.readyState === WebSocket.OPEN) {
        globalWs.send(
          JSON.stringify({
            type: "typing_stop",
            payload: { conversationId, targetUserId },
          })
        );
      }
    },
    []
  );

  const isOnline = useCallback(
    (userId: string) => {
      return globalState.onlineUsers.some((u) => u.userId === userId);
    },
    [globalState.onlineUsers]
  );

  const clearNotification = useCallback((notifId: string) => {
    globalState = {
      ...globalState,
      notifications: globalState.notifications.filter((n) => n.id !== notifId),
    };
    notifyListeners();
  }, []);

  return {
    connected: globalState.connected,
    onlineUsers: globalState.onlineUsers,
    onlineCount: globalState.onlineUsers.length,
    notifications: globalState.notifications,
    unreadCount: globalState.notifications.length,
    typingIndicators: globalState.typingIndicators,
    isOnline,
    sendTypingStart,
    sendTypingStop,
    clearNotification,
  };
}
