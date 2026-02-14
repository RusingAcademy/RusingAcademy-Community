import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/i18n/LocaleContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, DollarSign, TrendingUp, Users, BarChart3, Activity, BookOpen, Calendar, Sparkles, Hash } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";

export default function RevenueDashboard() {
  const { t } = useLocale();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [period] = useState(30);

  const periodInput = useMemo(() => ({ days: period }), [period]);
  const { data: revenue, isLoading: revLoading } = trpc.advancedAnalytics.revenueDashboard.useQuery(periodInput, { enabled: user?.role === "admin" });
  const { data: engagement, isLoading: engLoading } = trpc.advancedAnalytics.engagementMetrics.useQuery(periodInput, { enabled: user?.role === "admin" });
  const { data: content } = trpc.advancedAnalytics.contentPerformance.useQuery(undefined, { enabled: user?.role === "admin" });
  const { data: referralStats } = trpc.advancedAnalytics.referralAnalytics.useQuery(undefined, { enabled: user?.role === "admin" });

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  const isLoading = revLoading || engLoading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B1464]/5 to-background">
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-16">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t.membership.backToCommunity}
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: "#1B1464" }}>
            {t.revenue.title}
          </h1>
          <p className="text-muted-foreground">{t.revenue.subtitle}</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#1B1464]" />
          </div>
        ) : (
          <>
            {/* Revenue KPIs */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Revenue", value: `$${(revenue?.totalRevenue ?? 0).toFixed(2)}`, icon: DollarSign, color: "#22C55E", sub: `${revenue?.transactionCount ?? 0} transactions` },
                { label: "MRR", value: `$${(revenue?.mrr ?? 0).toFixed(2)}`, icon: TrendingUp, color: "#1B1464", sub: `ARR: $${(revenue?.arr ?? 0).toFixed(2)}` },
                { label: "Active Subs", value: String(revenue?.tierBreakdown?.reduce((s, t) => s + (t.activeCount ?? 0), 0) ?? 0), icon: Users, color: "#D4AF37", sub: `Churn: ${revenue?.churnRate ?? 0}%` },
                { label: "Active Users", value: String(engagement?.activeUsers ?? 0), icon: Activity, color: "#8B5CF6", sub: `${engagement?.retentionRate ?? 0}% retention` },
              ].map((kpi) => (
                <Card key={kpi.label} className="border hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: kpi.color + "15" }}>
                        <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
                      </div>
                      <span className="text-sm text-muted-foreground">{kpi.label}</span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Engagement Metrics */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "New Users", value: engagement?.newUsers ?? 0, icon: Users, color: "#3B82F6" },
                { label: "Posts Created", value: engagement?.postsCreated ?? 0, icon: BarChart3, color: "#1B1464" },
                { label: "Course Enrollments", value: engagement?.courseEnrollments ?? 0, icon: BookOpen, color: "#D4AF37" },
                { label: "AI Corrections", value: engagement?.aiCorrections ?? 0, icon: Sparkles, color: "#8B5CF6" },
              ].map((metric) => (
                <Card key={metric.label} className="border">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: metric.color + "15" }}>
                      <metric.icon className="w-4 h-4" style={{ color: metric.color }} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{metric.label}</p>
                      <p className="text-lg font-bold">{metric.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Tier Breakdown */}
              <Card className="border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="w-5 h-5" style={{ color: "#D4AF37" }} />
                    Subscription Tiers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!revenue?.tierBreakdown || revenue.tierBreakdown.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No active subscriptions yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {revenue.tierBreakdown.map((tier) => (
                        <div key={tier.tierSlug} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                          <div>
                            <p className="text-sm font-medium">{tier.tierName}</p>
                            <p className="text-xs text-muted-foreground">{tier.activeCount} subscribers</p>
                          </div>
                          <p className="text-sm font-bold" style={{ color: "#22C55E" }}>
                            ${parseFloat(String(tier.revenue ?? "0")).toFixed(2)}/mo
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Referral Stats */}
              <Card className="border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" style={{ color: "#1B1464" }} />
                    Referral Program
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!referralStats ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No referral data yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Total Referrals", value: referralStats.totalReferrals },
                        { label: "Conversions", value: referralStats.totalConversions },
                        { label: "Total Clicks", value: referralStats.totalClicks },
                        { label: "Commissions", value: `$${referralStats.totalCommissions.toFixed(2)}` },
                      ].map((stat) => (
                        <div key={stat.label} className="p-3 rounded-xl bg-muted/50 text-center">
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                          <p className="text-lg font-bold">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Top Courses */}
              <Card className="border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5" style={{ color: "#D4AF37" }} />
                    Top Courses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!content?.topCourses || content.topCourses.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No course data yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {content.topCourses.map((course, i) => (
                        <div key={course.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                          <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{course.title}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs">{course.enrollments ?? 0} enrolled</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Threads */}
              <Card className="border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" style={{ color: "#1B1464" }} />
                    Top Threads
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!content?.topThreads || content.topThreads.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No thread data yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {content.topThreads.map((thread, i) => (
                        <div key={thread.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                          <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{thread.title}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{thread.views ?? 0} views</span>
                            <span>{thread.likes ?? 0} likes</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
