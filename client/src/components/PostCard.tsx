// DESIGN: Premium PostCard — layered shadows, hover lift, content badges, author rings, animated engagement
import type { Post } from "@/lib/data";
import { useLocale } from "@/i18n/LocaleContext";
import { MessageCircle, ThumbsUp, Play, Mic, BookOpen, HelpCircle, Bookmark } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useToggleLike } from "@/hooks/useCommunityData";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { motion } from "framer-motion";

const roleBadgeStyles: Record<string, { bg: string; text: string; border: string }> = {
  "Community Tutor": {
    bg: "rgba(212, 175, 55, 0.08)",
    text: "#B8941F",
    border: "rgba(212, 175, 55, 0.15)",
  },
  "Professional Teacher": {
    bg: "rgba(27, 20, 100, 0.06)",
    text: "#1B1464",
    border: "rgba(27, 20, 100, 0.12)",
  },
  Student: {
    bg: "rgba(45, 37, 128, 0.05)",
    text: "#2D2580",
    border: "rgba(45, 37, 128, 0.1)",
  },
  Official: {
    bg: "rgba(27, 20, 100, 0.08)",
    text: "#1B1464",
    border: "rgba(27, 20, 100, 0.15)",
  },
};

const typeIcons: Record<string, { icon: typeof Mic; label: string; color: string; bg: string }> = {
  podcast: { icon: Mic, label: "Podcast", color: "#1B1464", bg: "rgba(27, 20, 100, 0.06)" },
  exercise: { icon: BookOpen, label: "Exercise", color: "#D4AF37", bg: "rgba(212, 175, 55, 0.08)" },
  question: { icon: HelpCircle, label: "Question", color: "#2D2580", bg: "rgba(45, 37, 128, 0.06)" },
};

export default function PostCard({ post }: { post: Post }) {
  const { t } = useLocale();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const toggleLikeMutation = useToggleLike();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [expanded, setExpanded] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const handleLike = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((prev) => (newLiked ? prev + 1 : prev - 1));
    const numericId = Number(post.id);
    if (!isNaN(numericId) && numericId > 0) {
      toggleLikeMutation.mutate(
        { threadId: numericId },
        {
          onError: () => {
            setLiked(!newLiked);
            setLikeCount((prev) => (newLiked ? prev - 1 : prev + 1));
            toast.error("Failed to update like");
          },
        }
      );
    }
  };

  const typeInfo = post.type ? typeIcons[post.type] : null;
  const roleStyle = roleBadgeStyles[post.author.role] || {
    bg: "rgba(27, 20, 100, 0.04)",
    text: "rgba(27, 20, 100, 0.6)",
    border: "rgba(27, 20, 100, 0.08)",
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative rounded-2xl p-5 transition-all duration-300"
      style={{
        background: "white",
        border: "1px solid rgba(27, 20, 100, 0.05)",
        boxShadow: "var(--shadow-card)",
      }}
      whileHover={{
        y: -3,
        boxShadow: "0 8px 24px rgba(15, 10, 60, 0.06), 0 2px 8px rgba(15, 10, 60, 0.03)",
      }}
    >
      {/* Content type badge (top-right) */}
      {typeInfo && (
        <div
          className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
          style={{
            background: typeInfo.bg,
            color: typeInfo.color,
          }}
        >
          <typeInfo.icon className="w-3 h-3" strokeWidth={2.5} />
          {typeInfo.label}
        </div>
      )}

      {/* Author row */}
      <div className="flex items-center gap-3 mb-4">
        <div className="avatar-ring">
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground tracking-tight">
              {post.author.name}
            </span>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: roleStyle.bg,
                color: roleStyle.text,
                border: `1px solid ${roleStyle.border}`,
              }}
            >
              {post.author.role}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground/70 font-medium">{post.date}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <h3
            className="text-[15px] font-bold text-foreground mb-2 leading-snug cursor-pointer transition-colors duration-200 hover:text-[#1B1464] line-clamp-2"
            onClick={() => {
              const numericId = Number(post.id);
              if (!isNaN(numericId) && numericId > 0) {
                navigate(`/thread/${numericId}`);
              }
            }}
          >
            {post.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {expanded ? post.excerpt : post.excerpt.slice(0, 180)}
            {!expanded && post.excerpt.length > 180 && (
              <>
                {"... "}
                <button
                  onClick={() => setExpanded(true)}
                  className="text-[#1B1464] font-semibold hover-underline text-xs"
                >
                  Read more
                </button>
              </>
            )}
          </p>

          {/* Render embedded GIF if present in content */}
          {post.excerpt && (() => {
            const gifMatch = post.excerpt.match(/!\[GIF\]\((https?:\/\/[^)]+\.gif[^)]*)\)/i)
              || post.excerpt.match(/(https?:\/\/media\.tenor\.com\/[^\s)]+)/i)
              || post.excerpt.match(/(https?:\/\/media[0-9]*\.giphy\.com\/[^\s)]+)/i);
            if (!gifMatch) return null;
            const gifSrc = gifMatch[1];
            return (
              <div className="mt-3 rounded-xl overflow-hidden border border-border/50 bg-muted/20 relative">
                <img
                  src={gifSrc}
                  alt="GIF"
                  className="w-full max-h-[240px] object-contain"
                  loading="lazy"
                />
                <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/50 rounded-md">
                  <span className="text-[9px] text-white font-bold tracking-wider">GIF</span>
                </div>
              </div>
            );
          })()}

          {/* Audio player for podcasts */}
          {post.type === "podcast" && post.audioTitle && (
            <div
              className="mt-3 flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 hover:shadow-sm"
              style={{
                background: "linear-gradient(135deg, rgba(27, 20, 100, 0.03), rgba(45, 37, 128, 0.02))",
                border: "1px solid rgba(27, 20, 100, 0.06)",
              }}
            >
              <button
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #1B1464, #2D2580)",
                  boxShadow: "0 2px 8px rgba(27, 20, 100, 0.2)",
                }}
              >
                <Play className="w-4 h-4 text-white ml-0.5" />
              </button>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-foreground truncate block">
                  {post.audioTitle}
                </span>
                <div className="mt-1.5 h-1 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: "0%",
                      background: "linear-gradient(90deg, #1B1464, #D4AF37)",
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Quiz options for exercises */}
          {post.type === "exercise" && post.quizOptions && (
            <div className="mt-3 space-y-2">
              {post.quizOptions.map((option, i) => (
                <label
                  key={i}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group/option"
                  style={{
                    border: "1px solid rgba(27, 20, 100, 0.06)",
                    background: "rgba(248, 247, 244, 0.5)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(212, 175, 55, 0.25)";
                    e.currentTarget.style.background = "rgba(212, 175, 55, 0.04)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(27, 20, 100, 0.06)";
                    e.currentTarget.style.background = "rgba(248, 247, 244, 0.5)";
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full border-2 shrink-0 transition-colors"
                    style={{ borderColor: "rgba(27, 20, 100, 0.15)" }}
                  />
                  <span className="text-sm text-foreground font-medium">{option}</span>
                </label>
              ))}
              {post.quizCount !== undefined && post.quizCount > 0 && (
                <p className="text-[11px] text-muted-foreground font-medium mt-1">
                  {post.quizCount} quizzed
                </p>
              )}
            </div>
          )}
        </div>

        {/* Thumbnail with overlay */}
        {post.image && (
          <div className="relative w-24 h-20 rounded-xl overflow-hidden shrink-0 hidden sm:block group/thumb">
            <img
              src={post.image}
              alt=""
              className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-300" />
          </div>
        )}
      </div>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg cursor-pointer transition-all duration-200"
              style={{
                background: "rgba(27, 20, 100, 0.04)",
                color: "rgba(27, 20, 100, 0.6)",
                border: "1px solid rgba(27, 20, 100, 0.06)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(27, 20, 100, 0.08)";
                e.currentTarget.style.color = "#1B1464";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(27, 20, 100, 0.04)";
                e.currentTarget.style.color = "rgba(27, 20, 100, 0.6)";
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer: engagement bar */}
      <div
        className="flex items-center justify-between mt-4 pt-3"
        style={{ borderTop: "1px solid rgba(27, 20, 100, 0.04)" }}
      >
        <div className="flex items-center gap-1">
          {/* Like button */}
          <motion.button
            onClick={handleLike}
            aria-label={liked ? `Unlike (${likeCount} likes)` : `Like (${likeCount} likes)`}
            aria-pressed={liked}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200"
            style={{
              background: liked ? "rgba(212, 175, 55, 0.08)" : "transparent",
              color: liked ? "#D4AF37" : undefined,
            }}
            whileTap={{ scale: 0.92 }}
          >
            <ThumbsUp
              className={`w-4 h-4 transition-colors duration-200 ${
                liked ? "text-[#D4AF37]" : "text-muted-foreground"
              }`}
              fill={liked ? "currentColor" : "none"}
              strokeWidth={liked ? 2.5 : 1.8}
            />
            <span className={`text-xs font-semibold ${liked ? "text-[#D4AF37]" : "text-muted-foreground"}`}>
              {likeCount}
            </span>
          </motion.button>

          {/* Comment button */}
          <button
            onClick={() => {
              const numericId = Number(post.id);
              if (!isNaN(numericId) && numericId > 0) {
                navigate(`/thread/${numericId}`);
              }
            }}
            aria-label={`${post.comments} comments`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
          >
            <MessageCircle className="w-4 h-4" strokeWidth={1.8} />
            <span className="text-xs font-semibold">{post.comments}</span>
          </button>
        </div>

        {/* Bookmark button */}
        <motion.button
          onClick={() => {
            setBookmarked(!bookmarked);
            toast(bookmarked ? "Removed from bookmarks" : "Saved to bookmarks");
          }}
          className="p-1.5 rounded-lg transition-all duration-200 hover:bg-accent"
          whileTap={{ scale: 0.9 }}
        >
          <Bookmark
            className={`w-4 h-4 transition-colors duration-200 ${
              bookmarked ? "text-[#D4AF37]" : "text-muted-foreground"
            }`}
            fill={bookmarked ? "currentColor" : "none"}
            strokeWidth={1.8}
          />
        </motion.button>
      </div>
    </motion.article>
  );
}
