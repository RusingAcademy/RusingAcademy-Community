// DESIGN: Premium skeleton loading — shimmer animation with branded warm tones
export default function PostCardSkeleton() {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "white",
        border: "1px solid rgba(27, 20, 100, 0.04)",
        boxShadow: "var(--shadow-xs)",
      }}
    >
      {/* Author row skeleton */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full skeleton-shimmer" />
        <div className="flex flex-col gap-1.5">
          <div className="w-28 h-3.5 rounded-md skeleton-shimmer" />
          <div className="w-16 h-2.5 rounded-md skeleton-shimmer" />
        </div>
      </div>

      {/* Title skeleton */}
      <div className="w-3/4 h-4 rounded-md skeleton-shimmer mb-2" />

      {/* Content skeleton */}
      <div className="space-y-2 mb-4">
        <div className="w-full h-3 rounded-md skeleton-shimmer" />
        <div className="w-5/6 h-3 rounded-md skeleton-shimmer" />
        <div className="w-2/3 h-3 rounded-md skeleton-shimmer" />
      </div>

      {/* Tags skeleton */}
      <div className="flex gap-2 mb-4">
        <div className="w-16 h-6 rounded-lg skeleton-shimmer" />
        <div className="w-20 h-6 rounded-lg skeleton-shimmer" />
        <div className="w-14 h-6 rounded-lg skeleton-shimmer" />
      </div>

      {/* Footer skeleton */}
      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: "1px solid rgba(27, 20, 100, 0.04)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-14 h-7 rounded-lg skeleton-shimmer" />
          <div className="w-14 h-7 rounded-lg skeleton-shimmer" />
        </div>
        <div className="w-7 h-7 rounded-lg skeleton-shimmer" />
      </div>
    </div>
  );
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}
