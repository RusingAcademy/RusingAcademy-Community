import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/i18n/LocaleContext";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useWebSocket } from "@/hooks/useWebSocket";
import OnlineIndicator, { TypingIndicator } from "@/components/OnlineIndicator";
import {
  MessageCircle,
  Send,
  ArrowLeft,
  Search,
  Check,
  CheckCheck,
  Wifi,
  WifiOff,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

function formatMsgTime(date: Date | string) {
  const d = new Date(date);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
}

export default function MessagesPage() {
  const { t } = useLocale();
  const { user, isAuthenticated } = useAuth();
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const {
    connected,
    isOnline,
    onlineCount,
    sendTypingStart,
    sendTypingStop,
    typingIndicators,
    notifications,
  } = useWebSocket();

  const conversations = trpc.dm.listConversations.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: connected ? 30000 : 10000, // Slower polling when WS is active
  });

  const activeMessages = trpc.dm.listMessages.useQuery(
    { conversationId: activeConvId!, limit: 50 },
    { enabled: !!activeConvId, refetchInterval: connected ? 15000 : 5000 }
  );

  const sendMessage = trpc.dm.sendMessage.useMutation({
    onSuccess: () => {
      setMessageText("");
      activeMessages.refetch();
      conversations.refetch();
    },
  });

  const markRead = trpc.dm.markRead.useMutation();

  // Refetch messages when a new DM notification arrives via WebSocket
  useEffect(() => {
    const dmNotifs = notifications.filter((n) => n.type === "new_message");
    if (dmNotifs.length > 0) {
      conversations.refetch();
      if (activeConvId) {
        activeMessages.refetch();
      }
    }
  }, [notifications.length]);

  useEffect(() => {
    if (activeConvId) {
      markRead.mutate({ conversationId: activeConvId });
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.data]);

  const activeConv = conversations.data?.find((c) => c.id === activeConvId);
  const otherUserId = activeConv?.otherUser?.id;

  // Typing indicator logic
  const handleTyping = useCallback(() => {
    if (!activeConvId || !otherUserId) return;
    sendTypingStart(String(activeConvId), String(otherUserId));

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStop(String(activeConvId), String(otherUserId));
    }, 3000);
  }, [activeConvId, otherUserId, sendTypingStart, sendTypingStop]);

  const handleSend = () => {
    if (!messageText.trim() || !activeConvId) return;
    // Stop typing indicator
    if (otherUserId) {
      sendTypingStop(String(activeConvId), String(otherUserId));
    }
    sendMessage.mutate({
      conversationId: activeConvId,
      content: messageText.trim(),
    });
  };

  // Check if other user is typing in this conversation
  const otherUserTyping = otherUserId
    ? typingIndicators.get(`${otherUserId}_${activeConvId}`)?.isTyping
    : false;

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <MessageCircle className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-xl font-bold">Sign in to message</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          Connect with other learners and coaches through direct messages.
        </p>
        <Button
          onClick={() => (window.location.href = getLoginUrl())}
          className="rounded-full px-6"
          style={{ backgroundColor: "#1B1464" }}
        >
          Sign In
        </Button>
      </div>
    );
  }

  const filteredConvs = conversations.data?.filter((c) =>
    searchQuery
      ? c.otherUser.name?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <div className="flex h-[calc(100vh-64px)] bg-background">
      {/* Conversation List */}
      <div
        className={`w-full md:w-[340px] border-r border-border flex flex-col ${
          activeConvId ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-foreground">Messages</h2>
            {/* Connection status indicator */}
            <div className="flex items-center gap-1.5">
              {connected ? (
                <Wifi className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-red-400" />
              )}
              {connected && onlineCount > 0 && (
                <span className="text-[10px] text-muted-foreground font-medium">
                  {onlineCount} online
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-border bg-muted/30">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-muted" />
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-3 w-40 bg-muted rounded mt-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConvs?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <MessageCircle className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No conversations yet. Visit a member's profile to start a conversation.
              </p>
            </div>
          ) : (
            filteredConvs?.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left ${
                  activeConvId === conv.id ? "bg-muted/70" : ""
                }`}
              >
                <div className="relative">
                  {conv.otherUser.avatarUrl ? (
                    <img
                      src={conv.otherUser.avatarUrl}
                      alt={conv.otherUser.name || ""}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#1B1464] flex items-center justify-center text-white font-bold">
                      {conv.otherUser.name?.charAt(0) || "?"}
                    </div>
                  )}
                  {/* Online presence indicator */}
                  <OnlineIndicator userId={conv.otherUser.id} size="md" />
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#D4AF37] text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm truncate">
                        {conv.otherUser.name || "Unknown"}
                      </span>
                      {isOnline(String(conv.otherUser.id)) && (
                        <span className="text-[9px] text-green-500 font-semibold uppercase tracking-wider">
                          online
                        </span>
                      )}
                    </div>
                    {conv.lastMessageAt && (
                      <span className="text-xs text-muted-foreground">
                        {formatMsgTime(conv.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  {conv.lastMessagePreview && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {conv.lastMessagePreview}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message Thread */}
      <div
        className={`flex-1 flex flex-col ${
          !activeConvId ? "hidden md:flex" : "flex"
        }`}
      >
        {!activeConvId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-bold text-foreground">
              Select a conversation
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Choose a conversation from the list to start messaging.
            </p>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background">
              <button
                onClick={() => setActiveConvId(null)}
                className="md:hidden p-1 hover:bg-muted rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="relative">
                {activeConv?.otherUser.avatarUrl ? (
                  <img
                    src={activeConv.otherUser.avatarUrl}
                    alt={activeConv.otherUser.name || ""}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#1B1464] flex items-center justify-center text-white font-bold">
                    {activeConv?.otherUser.name?.charAt(0) || "?"}
                  </div>
                )}
                {otherUserId && <OnlineIndicator userId={otherUserId} size="sm" />}
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {activeConv?.otherUser.name || "Unknown"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {otherUserId && isOnline(String(otherUserId)) ? (
                    <span className="text-green-500 font-medium">Online now</span>
                  ) : (
                    "Offline"
                  )}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {activeMessages.isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-[#1B1464] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : activeMessages.data?.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-sm text-muted-foreground">
                    No messages yet. Say hello!
                  </p>
                </div>
              ) : (
                activeMessages.data?.messages.map((msg) => {
                  const isMine = msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                          isMine
                            ? "bg-[#1B1464] text-white rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md"
                        }`}
                      >
                        {/* Render GIF if message contains a GIF URL */}
                        {msg.content.match(/\.(gif)$/i) ||
                        msg.content.includes("tenor.com/") ||
                        msg.content.includes("giphy.com/") ? (
                          <img
                            src={msg.content}
                            alt="GIF"
                            className="max-w-full rounded-lg"
                            style={{ maxHeight: 200 }}
                          />
                        ) : (
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                        )}
                        <div
                          className={`flex items-center gap-1 mt-1 ${
                            isMine ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span
                            className={`text-[10px] ${
                              isMine ? "text-white/60" : "text-muted-foreground"
                            }`}
                          >
                            {format(new Date(msg.createdAt), "h:mm a")}
                          </span>
                          {isMine &&
                            (msg.isRead ? (
                              <CheckCheck className="w-3 h-3 text-white/60" />
                            ) : (
                              <Check className="w-3 h-3 text-white/60" />
                            ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {otherUserTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2">
                    <TypingIndicator />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="px-4 py-3 border-t border-border bg-background">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && handleSend()
                  }
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 rounded-full border border-border bg-muted/30 text-sm outline-none focus:border-[#1B1464] transition-colors"
                />
                <Button
                  onClick={handleSend}
                  disabled={!messageText.trim() || sendMessage.isPending}
                  className="rounded-full w-10 h-10 p-0"
                  style={{ backgroundColor: "#1B1464" }}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
