import { useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/i18n/LocaleContext";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ThumbsUp,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Send,
  Loader2,
  Edit3,
  Trash2,
  Eye,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ThreadDetail() {
  const { t } = useLocale();
  const [, params] = useRoute("/thread/:id");
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const threadId = Number(params?.id);

  const { data: thread, isLoading } = trpc.forum.getThread.useQuery(
    { id: threadId },
    { enabled: !!threadId }
  );

  const { data: comments, isLoading: commentsLoading } = trpc.forum.listComments.useQuery(
    { threadId, limit: 50, offset: 0 },
    { enabled: !!threadId }
  );

  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null);
  const [editingComment, setEditingComment] = useState<{ id: number; content: string } | null>(null);

  const utils = trpc.useUtils();

  const addComment = trpc.forum.addComment.useMutation({
    onSuccess: () => {
      setCommentText("");
      setReplyTo(null);
      utils.forum.listComments.invalidate({ threadId });
      utils.forum.getThread.invalidate({ id: threadId });
      toast.success("Comment posted");
    },
    onError: () => toast.error("Failed to post comment"),
  });

  const toggleLike = trpc.forum.toggleThreadLike.useMutation({
    onSuccess: () => {
      utils.forum.getThread.invalidate({ id: threadId });
      utils.forum.getUserLikes.invalidate();
    },
  });

  const toggleCommentLike = trpc.forum.toggleCommentLike.useMutation({
    onSuccess: () => {
      utils.forum.listComments.invalidate({ threadId });
    },
  });

  const editComment = trpc.forum.editComment.useMutation({
    onSuccess: () => {
      setEditingComment(null);
      utils.forum.listComments.invalidate({ threadId });
      toast.success("Comment updated");
    },
    onError: () => toast.error("Failed to update comment"),
  });

  const deleteComment = trpc.forum.deleteComment.useMutation({
    onSuccess: () => {
      utils.forum.listComments.invalidate({ threadId });
      utils.forum.getThread.invalidate({ id: threadId });
      toast.success("Comment deleted");
    },
    onError: () => toast.error("Failed to delete comment"),
  });

  // Organize comments into threads
  const organizedComments = useMemo(() => {
    if (!comments) return [];
    const topLevel = comments.filter((c: any) => !c.parentId);
    const replies = comments.filter((c: any) => c.parentId);
    return topLevel.map((c: any) => ({
      ...c,
      replies: replies.filter((r: any) => r.parentId === c.id),
    }));
  }, [comments]);

  const handleSubmitComment = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (!commentText.trim()) return;

    addComment.mutate({
      threadId,
      content: commentText.trim(),
      parentId: replyTo?.id,
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-lg text-muted-foreground">Post not found</p>
        <Button onClick={() => navigate("/")} variant="outline" className="rounded-full">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Community
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-[720px] mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-full hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <span className="text-sm font-semibold text-foreground truncate">
            {thread.title}
          </span>
        </div>
      </header>

      <main className="max-w-[720px] mx-auto px-4 py-6">
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          {/* Author */}
          <div className="flex items-center gap-3 mb-4">
            <img
              src={thread.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${thread.authorId}`}
              alt={thread.authorName || "Author"}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-border"
            />
            <div>
              <p className="font-semibold text-foreground">{thread.authorName || "Anonymous"}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>
                  {thread.createdAt
                    ? new Date(thread.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : ""}
                </span>
                <span>·</span>
                <Eye className="w-3 h-3" />
                <span>{thread.viewCount ?? 0} views</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground mb-4 leading-tight">
            {thread.title}
          </h1>

          {/* Thumbnail */}
          {thread.thumbnailUrl && (
            <img
              src={thread.thumbnailUrl}
              alt=""
              className="w-full rounded-xl mb-4 max-h-[400px] object-cover"
            />
          )}

          {/* Content */}
          <div className="text-foreground leading-relaxed whitespace-pre-wrap text-[15px]">
            {thread.content}
          </div>

          {/* Actions Bar */}
          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-border/50">
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  window.location.href = getLoginUrl();
                  return;
                }
                toggleLike.mutate({ threadId });
              }}
              className="flex items-center gap-2 text-muted-foreground hover:text-[#D4AF37] transition-colors"
            >
              <ThumbsUp className="w-5 h-5" />
              <span className="text-sm font-medium">{thread.likeCount ?? 0}</span>
            </button>
            <button className="flex items-center gap-2 text-muted-foreground">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{thread.replyCount ?? 0}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors ml-auto"
            >
              <Share2 className="w-5 h-5" />
              <span className="text-sm font-medium">Share</span>
            </button>
          </div>
        </motion.article>

        {/* Comments Section */}
        <div className="mt-6">
          <h2 className="text-lg font-bold text-foreground mb-4">
            Comments ({thread.replyCount ?? 0})
          </h2>

          {/* Comment Input */}
          <div className="bg-card rounded-2xl border border-border p-4 mb-6">
            {replyTo && (
              <div className="flex items-center gap-2 mb-2 text-xs text-[#1B1464] bg-[#1B1464]/5 px-3 py-1.5 rounded-full w-fit">
                <span>Replying to {replyTo.name}</span>
                <button onClick={() => setReplyTo(null)} className="hover:text-red-500">
                  ×
                </button>
              </div>
            )}
            <div className="flex gap-3">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={
                  isAuthenticated
                    ? "Write a comment..."
                    : "Sign in to comment..."
                }
                className="flex-1 bg-accent/50 rounded-xl px-4 py-3 text-sm outline-none resize-none min-h-[80px] placeholder:text-muted-foreground/50"
                disabled={!isAuthenticated}
              />
            </div>
            <div className="flex justify-end mt-3">
              <Button
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || addComment.isPending}
                className="rounded-full px-5 text-sm font-semibold text-white"
                style={{ backgroundColor: "#1B1464" }}
                size="sm"
              >
                {addComment.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-1.5" /> Post
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Comments List */}
          {commentsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" />
            </div>
          ) : organizedComments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No comments yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {organizedComments.map((comment: any) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  currentUserId={user?.id}
                  isAuthenticated={isAuthenticated}
                  onReply={(id: number, name: string) => setReplyTo({ id, name })}
                  onLike={(postId: number) => toggleCommentLike.mutate({ postId })}
                  onEdit={(id: number, content: string) => setEditingComment({ id, content })}
                  onDelete={(id: number) => {
                    if (confirm("Delete this comment?")) {
                      deleteComment.mutate({ id });
                    }
                  }}
                  editingComment={editingComment}
                  onSaveEdit={(id: number, content: string) => editComment.mutate({ id, content })}
                  onCancelEdit={() => setEditingComment(null)}
                  setEditingContent={(content: string) =>
                    setEditingComment((prev) => (prev ? { ...prev, content } : null))
                  }
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Comment Card Component ───────────────────────────────────────
function CommentCard({
  comment,
  currentUserId,
  isAuthenticated,
  onReply,
  onLike,
  onEdit,
  onDelete,
  editingComment,
  onSaveEdit,
  onCancelEdit,
  setEditingContent,
}: {
  comment: any;
  currentUserId?: number;
  isAuthenticated: boolean;
  onReply: (id: number, name: string) => void;
  onLike: (postId: number) => void;
  onEdit: (id: number, content: string) => void;
  onDelete: (id: number) => void;
  editingComment: { id: number; content: string } | null;
  onSaveEdit: (id: number, content: string) => void;
  onCancelEdit: () => void;
  setEditingContent: (content: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const isEditing = editingComment?.id === comment.id;
  const isOwner = currentUserId === comment.authorId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-4"
    >
      {/* Author Row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <img
            src={comment.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.authorId}`}
            alt={comment.authorName || "User"}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div>
            <span className="text-sm font-semibold text-foreground">
              {comment.authorName || "Anonymous"}
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              {comment.createdAt
                ? new Date(comment.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : ""}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-muted-foreground ml-1">(edited)</span>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1.5 rounded-full hover:bg-accent transition-colors"
            >
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
            {showActions && (
              <div className="absolute right-0 top-full mt-1 bg-card rounded-lg border border-border shadow-lg z-10 py-1 min-w-[120px]">
                <button
                  onClick={() => {
                    onEdit(comment.id, comment.content);
                    setShowActions(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => {
                    onDelete(comment.id);
                    setShowActions(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="mb-2">
          <textarea
            value={editingComment?.content ?? ""}
            onChange={(e) => setEditingContent(e.target.value)}
            className="w-full bg-accent/50 rounded-lg px-3 py-2 text-sm outline-none resize-none min-h-[60px]"
          />
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              onClick={() => onSaveEdit(comment.id, editingComment?.content ?? "")}
              className="rounded-full text-xs text-white"
              style={{ backgroundColor: "#1B1464" }}
            >
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={onCancelEdit} className="rounded-full text-xs">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap mb-2">
          {comment.content}
        </p>
      )}

      {/* Comment Actions */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <button
          onClick={() => {
            if (!isAuthenticated) return;
            onLike(comment.id);
          }}
          className="flex items-center gap-1 hover:text-[#D4AF37] transition-colors"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>{comment.likeCount ?? 0}</span>
        </button>
        <button
          onClick={() => onReply(comment.id, comment.authorName || "Anonymous")}
          className="flex items-center gap-1 hover:text-[#1B1464] transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Reply</span>
        </button>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 ml-6 space-y-3 border-l-2 border-[#D4AF37]/20 pl-4">
          {comment.replies.map((reply: any) => (
            <div key={reply.id} className="flex gap-2">
              <img
                src={reply.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.authorId}`}
                alt={reply.authorName || "User"}
                className="w-6 h-6 rounded-full object-cover mt-0.5"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    {reply.authorName || "Anonymous"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {reply.createdAt
                      ? new Date(reply.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : ""}
                  </span>
                </div>
                <p className="text-xs text-foreground leading-relaxed mt-0.5">
                  {reply.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
