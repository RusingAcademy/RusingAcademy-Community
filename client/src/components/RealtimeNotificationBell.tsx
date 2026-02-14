/**
 * RealtimeNotificationBell — Merges tRPC notification count with WebSocket real-time push
 * Shows combined unread count and plays a subtle animation on new notifications
 */
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWebSocket } from "@/hooks/useWebSocket";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface RealtimeNotificationBellProps {
  onClick?: () => void;
}

export default function RealtimeNotificationBell({ onClick }: RealtimeNotificationBellProps) {
  const { isAuthenticated } = useAuth();
  const { unreadCount: wsUnread } = useWebSocket();

  const notificationsQuery = trpc.notifications.list.useQuery(
    { limit: 5, offset: 0 },
    { enabled: isAuthenticated }
  );

  const dbUnread = notificationsQuery.data?.unreadCount ?? 0;
  // Combine: DB-stored unread + any new real-time notifications not yet persisted
  const totalUnread = dbUnread + wsUnread;

  return (
    <button
      onClick={onClick}
      className="relative p-2.5 rounded-xl transition-all duration-200 hover:bg-accent active:scale-95 group"
    >
      <Bell
        className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors duration-200"
        strokeWidth={1.8}
      />
      <AnimatePresence>
        {totalUnread > 0 && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold rounded-full text-white"
            style={{
              background: "linear-gradient(135deg, #D4AF37, #E8CB6A)",
              boxShadow: "0 2px 6px rgba(212, 175, 55, 0.3)",
              animation: wsUnread > 0 ? "pulse-glow 2s ease-in-out infinite" : undefined,
            }}
          >
            {totalUnread > 9 ? "9+" : totalUnread}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
