import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/i18n/LocaleContext";
import {
  BarChart3,
  Users,
  FileText,
  MessageCircle,
  BookOpen,
  TrendingUp,
  Award,
  Calendar,
  Target,
  Shield,
} from "lucide-react";

function StatCard({
  icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subValue?: string;
  color: string;
}) {
  return (
    <div className="p-5 rounded-2xl border border-border bg-card hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-xl ${color}`}>{icon}</div>
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      {subValue && (
        <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const { t } = useLocale();
  const { user } = useAuth();

  const overview = trpc.analytics.overview.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const topContributors = trpc.analytics.topContributors.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const timeline = trpc.analytics.activityTimeline.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const courseStats = trpc.analytics.courseStats.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const eventStats = trpc.analytics.eventStats.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const challengeStats = trpc.analytics.challengeStats.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const modStats = trpc.moderation.stats.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <BarChart3 className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-xl font-bold">Admin Access Required</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          Analytics are only accessible to community administrators.
        </p>
      </div>
    );
  }

  const isLoading = overview.isLoading;

  return (
    <div className="max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-[#1B1464]/10">
          <BarChart3 className="w-6 h-6 text-[#1B1464]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t.analyticsPage.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t.analyticsPage.subtitle}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-border animate-pulse"
            >
              <div className="h-4 w-20 bg-muted rounded mb-3" />
              <div className="h-8 w-16 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <StatCard
              icon={<Users className="w-5 h-5 text-[#1B1464]" />}
              label="Total Members"
              value={overview.data?.totalMembers ?? 0}
              subValue={`+${overview.data?.newMembersThisWeek ?? 0} this week`}
              color="bg-[#1B1464]/10"
            />
            <StatCard
              icon={<FileText className="w-5 h-5 text-[#D4AF37]" />}
              label="Total Posts"
              value={overview.data?.totalPosts ?? 0}
              subValue={`+${overview.data?.postsThisWeek ?? 0} this week`}
              color="bg-[#D4AF37]/10"
            />
            <StatCard
              icon={<MessageCircle className="w-5 h-5 text-green-600" />}
              label="Total Comments"
              value={overview.data?.totalComments ?? 0}
              color="bg-green-50"
            />
            <StatCard
              icon={<BookOpen className="w-5 h-5 text-purple-600" />}
              label="Course Enrollments"
              value={overview.data?.totalEnrollments ?? 0}
              color="bg-purple-50"
            />
            <StatCard
              icon={<Calendar className="w-5 h-5 text-blue-600" />}
              label="Upcoming Events"
              value={eventStats.data?.upcoming ?? 0}
              subValue={`${eventStats.data?.totalRegistrations ?? 0} total registrations`}
              color="bg-blue-50"
            />
            <StatCard
              icon={<Shield className="w-5 h-5 text-red-600" />}
              label="Pending Reports"
              value={modStats.data?.pending ?? 0}
              subValue={`${modStats.data?.activeSuspensions ?? 0} active suspensions`}
              color="bg-red-50"
            />
          </div>

          {/* Activity Timeline */}
          {timeline.data && timeline.data.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#1B1464]" />
                Activity (Last 30 Days)
              </h2>
              <div className="p-4 rounded-2xl border border-border bg-card">
                <div className="flex items-end gap-1 h-[160px]">
                  {timeline.data.map((day, i) => {
                    const maxVal = Math.max(
                      ...timeline.data!.map((d) => d.posts + d.comments),
                      1
                    );
                    const height = ((day.posts + day.comments) / maxVal) * 100;
                    return (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center gap-1 group relative"
                      >
                        <div className="absolute -top-8 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {day.date}: {day.posts}p, {day.comments}c
                        </div>
                        <div
                          className="w-full rounded-t-sm bg-[#1B1464] transition-all hover:bg-[#D4AF37]"
                          style={{ height: `${Math.max(height, 2)}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>{timeline.data[0]?.date}</span>
                  <span>{timeline.data[timeline.data.length - 1]?.date}</span>
                </div>
              </div>
            </div>
          )}

          {/* Top Contributors */}
          {topContributors.data && topContributors.data.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#D4AF37]" />
                Top Contributors
              </h2>
              <div className="rounded-2xl border border-border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                        Rank
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                        Member
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">
                        Total XP
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topContributors.data.map((entry, i) => (
                      <tr
                        key={entry.userId}
                        className="border-b border-border last:border-0 hover:bg-muted/20"
                      >
                        <td className="px-4 py-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              i === 0
                                ? "bg-[#D4AF37] text-white"
                                : i === 1
                                ? "bg-gray-300 text-gray-700"
                                : i === 2
                                ? "bg-amber-700 text-white"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {entry.user?.avatarUrl ? (
                              <img
                                src={entry.user.avatarUrl}
                                alt={entry.user.name || ""}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#1B1464] flex items-center justify-center text-white text-xs font-bold">
                                {entry.user?.name?.charAt(0) || "?"}
                              </div>
                            )}
                            <span className="font-medium text-sm">
                              {entry.user?.name || "Unknown"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-[#D4AF37]">
                            {Number(entry.totalXp).toLocaleString()} XP
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Course & Challenge Stats */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Course Stats */}
            {courseStats.data && courseStats.data.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  Course Performance
                </h2>
                <div className="space-y-3">
                  {courseStats.data.map((course) => (
                    <div
                      key={course.courseId}
                      className="p-4 rounded-xl border border-border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          Course #{course.courseId}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {course.totalEnrolled} enrolled
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all"
                          style={{ width: `${course.avgProgress}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span>Avg progress: {course.avgProgress}%</span>
                        <span>{course.completed} completed</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Challenge Stats */}
            {challengeStats.data && challengeStats.data.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-600" />
                  Challenge Completion
                </h2>
                <div className="space-y-3">
                  {challengeStats.data.map((challenge) => (
                    <div
                      key={challenge.challengeId}
                      className="p-4 rounded-xl border border-border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          Challenge #{challenge.challengeId}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {challenge.totalParticipants} participants
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full transition-all"
                          style={{ width: `${challenge.completionRate}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span>
                          Completion rate: {challenge.completionRate}%
                        </span>
                        <span>{challenge.completed} completed</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
