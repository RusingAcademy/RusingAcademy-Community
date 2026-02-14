import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocale } from "@/i18n/LocaleContext";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Bell,
  ThumbsUp,
  MessageCircle,
  Award,
  Calendar,
  BookOpen,
  Check,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  like: <ThumbsUp className="w-4 h-4 text-[#D4AF37]" />,
  comment: <MessageCircle className="w-4 h-4 text-blue-500" />,
  reply: <MessageCircle className="w-4 h-4 text-green-500" />,
  badge: <Award className="w-4 h-4 text-purple-500" />,
  level_up: <Award className="w-4 h-4 text-[#D4AF37]" />,
  event: <Calendar className="w-4 h-4 text-orange-500" />,
  challenge: <BookOpen className="w-4 h-4 text-[#1B1464]" />,
  system: <Bell className="w-4 h-4 text-muted-foreground" />,
};

export default function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const { t } = useLocale();
  const { isAuthenticated } = useAuth();

  const { data, isLoading } = trpc.notifications.list.useQuery(
    { limit: 30, offset: 0 },
    { enabled: isAuthenticated && isOpen, staleTime: 15_000 }
  );

  const unreadCount = data && 'unreadCount' in data ? data.unreadCount : 0;

  const utils = trpc.useUtils();

  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
    },
  });

  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      toast.success("All notifications marked as read");
    },
  });

  const notifications = (data && 'notifications' in data ? data.notifications : data) ?? [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] bg-card border-l border-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#1B1464]" />
                <h2 className="text-lg font-bold text-foreground">Notifications</h2>
                {(unreadCount ?? 0) > 0 && (
                  <span className="bg-[#D4AF37] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {(unreadCount ?? 0) > 0 && (
                  <button
                    onClick={() => markAllRead.mutate()}
                    className="text-xs font-medium text-[#1B1464] hover:underline"
                    disabled={markAllRead.isPending}
                  >
                    <CheckCheck className="w-4 h-4 inline mr-1" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-accent transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" />
                </div>
              ) : (notifications as any[]).length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">No notifications yet</p>
                  <p className="text-xs mt-1">
                    You'll be notified about likes, comments, and achievements
                  </p>
                </div>
              ) : (
                <div>
                  {(notifications as any[]).map((notif: any) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`flex gap-3 px-5 py-4 border-b border-border/50 hover:bg-accent/30 transition-colors cursor-pointer ${
                        !notif.isRead ? "bg-[#1B1464]/3" : ""
                      }`}
                      onClick={() => {
                        if (!notif.isRead) {
                          markRead.mutate({ id: notif.id });
                        }
                      }}
                    >
                      {/* Icon */}
                      <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5">
                        {iconMap[notif.type] || iconMap.system}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm leading-snug ${
                            !notif.isRead ? "font-semibold text-foreground" : "text-foreground/80"
                          }`}
                        >
                          {notif.title}
                        </p>
                        {notif.content && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {notif.content}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {notif.createdAt
                            ? formatTimeAgo(new Date(notif.createdAt))
                            : ""}
                        </p>
                      </div>

                      {/* Unread dot */}
                      {!notif.isRead && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] shrink-0 mt-2" />
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Notification Badge (for header) ──────────────────────────────
export function NotificationBadge({ onClick }: { onClick: () => void }) {
  const { isAuthenticated } = useAuth();
  const { data: countData } = trpc.notifications.list.useQuery(
    { limit: 1, offset: 0 },
    {
      enabled: isAuthenticated,
      staleTime: 15_000,
      refetchInterval: 30_000,
    }
  );
  const count = countData && 'unreadCount' in countData ? countData.unreadCount : 0;

  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-full hover:bg-accent transition-colors"
    >
      <Bell className="w-5 h-5 text-foreground" />
      {(count ?? 0) > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-[#D4AF37] text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] px-1">
          {count! > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
