import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useMemo } from "react";
import type { Post } from "@/lib/data";
import {
  posts as mockPosts,
  podcastPosts as mockPodcastPosts,
  exercisePosts as mockExercisePosts,
  questionPosts as mockQuestionPosts,
} from "@/lib/data";

// ── Map DB threads to Post type for the feed ──────────────────
function mapThreadToPost(thread: any): Post {
  const roleMap: Record<string, Post["author"]["role"]> = {
    coach: "Professional Teacher",
    admin: "Official",
    user: "Student",
    learner: "Student",
  };

  return {
    id: String(thread.id),
    author: {
      name: thread.authorName ?? "Anonymous",
      avatar: thread.authorAvatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${thread.authorId}`,
      role: roleMap[thread.authorRole ?? "user"] ?? "Student",
    },
    title: thread.title,
    excerpt: thread.content?.slice(0, 300) ?? "",
    image: thread.thumbnailUrl ?? undefined,
    date: thread.createdAt ? new Date(thread.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "",
    comments: thread.replyCount ?? 0,
    likes: thread.likeCount ?? 0,
    type: thread.contentType ?? "article",
    hasReadMore: (thread.content?.length ?? 0) > 300,
    audioTitle: thread.audioUrl ? "Listen to podcast" : undefined,
    tags: [],
  };
}

// ── Feed Hook ─────────────────────────────────────────────────
export function useFeed(contentType?: "article" | "podcast" | "exercise" | "question") {
  const { data, isLoading, error, refetch } = trpc.forum.listThreads.useQuery(
    { contentType, limit: 20, offset: 0 },
    { staleTime: 30_000 }
  );

  const posts = useMemo(() => {
    if (data && data.threads.length > 0) {
      return data.threads.map(mapThreadToPost);
    }
    // Fallback to mock data when DB is empty
    switch (contentType) {
      case "podcast": return mockPodcastPosts;
      case "exercise": return mockExercisePosts;
      case "question": return mockQuestionPosts;
      default: return mockPosts;
    }
  }, [data, contentType]);

  return { posts, isLoading, error, total: data?.total ?? posts.length, refetch };
}

// ── Leaderboard Hook ──────────────────────────────────────────
export function useLeaderboard(period: "weekly" | "monthly" | "all_time" = "weekly") {
  const { data, isLoading } = trpc.gamification.leaderboard.useQuery(
    { period, limit: 25 },
    { staleTime: 60_000 }
  );

  return { leaderboard: data ?? [], isLoading };
}

// ── My Stats Hook ─────────────────────────────────────────────
export function useMyStats() {
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = trpc.gamification.myStats.useQuery(
    undefined,
    { enabled: isAuthenticated, staleTime: 30_000 }
  );

  return { stats: data, isLoading };
}

// ── Events Hook ───────────────────────────────────────────────
export function useEvents() {
  const { data, isLoading } = trpc.events.list.useQuery(
    { limit: 20, offset: 0 },
    { staleTime: 60_000 }
  );

  return { events: data?.events ?? [], total: data?.total ?? 0, isLoading };
}

// ── Challenges Hook ───────────────────────────────────────────
export function useChallenges() {
  const { data, isLoading } = trpc.challenges.list.useQuery(
    { limit: 20 },
    { staleTime: 60_000 }
  );

  return { challenges: data ?? [], isLoading };
}

// ── Courses Hook ──────────────────────────────────────────────
export function useCourses(category?: string, level?: string) {
  const { data, isLoading } = trpc.classroom.listCourses.useQuery(
    { category, level, limit: 20, offset: 0 },
    { staleTime: 60_000 }
  );

  return { courses: data?.courses ?? [], total: data?.total ?? 0, isLoading };
}

// ── Notebook Hook ─────────────────────────────────────────────
export function useNotebookEntries(language?: "french" | "english") {
  const { data, isLoading } = trpc.notebook.list.useQuery(
    { language, limit: 20, offset: 0 },
    { staleTime: 30_000 }
  );

  return { entries: data?.entries ?? [], total: data?.total ?? 0, isLoading };
}

// ── Like Toggle Hook ──────────────────────────────────────────
export function useToggleLike() {
  const utils = trpc.useUtils();
  const mutation = trpc.forum.toggleThreadLike.useMutation({
    onSuccess: () => {
      utils.forum.listThreads.invalidate();
      utils.forum.getUserLikes.invalidate();
    },
  });

  return mutation;
}

// ── Create Thread Hook ────────────────────────────────────────
export function useCreateThread() {
  const utils = trpc.useUtils();
  const mutation = trpc.forum.createThread.useMutation({
    onSuccess: () => {
      utils.forum.listThreads.invalidate();
    },
  });

  return mutation;
}
