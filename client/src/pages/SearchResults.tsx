import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/i18n/LocaleContext";
import { useLocation, useSearch, Link } from "wouter";
import {
  Search,
  FileText,
  BookOpen,
  Calendar,
  Users,
  MessageCircle,
  Heart,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

type SearchType = "all" | "posts" | "courses" | "events" | "members";

const tabs: { id: SearchType; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All", icon: <Search className="w-4 h-4" /> },
  { id: "posts", label: "Posts", icon: <FileText className="w-4 h-4" /> },
  { id: "courses", label: "Courses", icon: <BookOpen className="w-4 h-4" /> },
  { id: "events", label: "Events", icon: <Calendar className="w-4 h-4" /> },
  { id: "members", label: "Members", icon: <Users className="w-4 h-4" /> },
];

export default function SearchResultsPage() {
  const { t } = useLocale();
  const searchParams = useSearch();
  const params = new URLSearchParams(searchParams);
  const initialQuery = params.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [activeType, setActiveType] = useState<SearchType>("all");
  const [, navigate] = useLocation();

  const stableQuery = useMemo(() => query, [query]);

  const results = trpc.search.search.useQuery(
    { query: stableQuery, type: activeType, limit: 20 },
    { enabled: stableQuery.length > 0 }
  );

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    navigate(`/search?q=${encodeURIComponent(newQuery)}`, { replace: true });
  };

  return (
    <div className="max-w-[800px] mx-auto px-4 py-6">
      {/* Search Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/">
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-2xl border border-border bg-muted/30 focus-within:border-[#1B1464] transition-colors">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search courses, posts, events, members..."
            className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
            autoFocus
          />
        </div>
      </div>

      {/* Type Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveType(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
              activeType === tab.id
                ? "text-[#1B1464] border-[#1B1464]"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
            {results.data && tab.id !== "all" && (
              <span className="text-xs ml-1 text-muted-foreground">
                ({results.data[tab.id === "posts" ? "posts" : tab.id === "courses" ? "courses" : tab.id === "events" ? "events" : "members"]?.length ?? 0})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Results */}
      {!query ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            Type to search across all community content
          </p>
        </div>
      ) : results.isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-2xl border border-border animate-pulse">
              <div className="h-5 w-48 bg-muted rounded mb-2" />
              <div className="h-4 w-full bg-muted rounded mb-1" />
              <div className="h-4 w-3/4 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : results.data?.total === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-lg font-semibold">No results found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try different keywords or browse the community feed
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Posts Results */}
          {(activeType === "all" || activeType === "posts") &&
            results.data?.posts.map((post: any) => (
              <Link key={`post-${post.id}`} href={`/thread/${post.id}`}>
                <div className="p-4 rounded-2xl border border-border hover:border-[#1B1464]/30 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-[#1B1464]" />
                    <span className="text-xs font-medium text-[#1B1464] uppercase">
                      Post
                    </span>
                    <span className="text-xs text-muted-foreground">
                      by {post.author?.name || "Unknown"}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" /> {post.likeCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" /> {post.replyCount}
                    </span>
                  </div>
                </div>
              </Link>
            ))}

          {/* Courses Results */}
          {(activeType === "all" || activeType === "courses") &&
            results.data?.courses.map((course: any) => (
              <div
                key={`course-${course.id}`}
                className="p-4 rounded-2xl border border-border hover:border-[#D4AF37]/30 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex gap-4">
                  {course.thumbnailUrl && (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="w-4 h-4 text-[#D4AF37]" />
                      <span className="text-xs font-medium text-[#D4AF37] uppercase">
                        Course
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground truncate">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                      {course.shortDescription || course.description}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{course.instructorName}</span>
                      <span>{course.totalEnrollments} enrolled</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

          {/* Events Results */}
          {(activeType === "all" || activeType === "events") &&
            results.data?.events.map((event: any) => (
              <div
                key={`event-${event.id}`}
                className="p-4 rounded-2xl border border-border hover:border-[#1B1464]/30 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-600 uppercase">
                    Event
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {event.startAt
                      ? format(new Date(event.startAt), "MMM d, yyyy")
                      : ""}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground">{event.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                  {event.description}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span>Hosted by {event.hostName}</span>
                  <span>{event.currentRegistrations} registered</span>
                </div>
              </div>
            ))}

          {/* Members Results */}
          {(activeType === "all" || activeType === "members") &&
            results.data?.members.map((member: any) => (
              <Link key={`member-${member.id}`} href={`/profile/${member.id}`}>
                <div className="p-4 rounded-2xl border border-border hover:border-[#1B1464]/30 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.name || ""}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#1B1464] flex items-center justify-center text-white font-bold">
                        {member.name?.charAt(0) || "?"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-medium text-purple-600 uppercase">
                          Member
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground">
                        {member.name || "Unknown"}
                      </h3>
                      {member.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {member.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
