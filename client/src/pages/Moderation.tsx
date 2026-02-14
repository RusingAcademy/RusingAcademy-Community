import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/i18n/LocaleContext";
import { Button } from "@/components/ui/button";
import {
  Shield,
  AlertTriangle,
  Check,
  X,
  Ban,
  Eye,
  Clock,
  User,
  FileText,
  MessageCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

type TabId = "reports" | "suspensions";

export default function ModerationPage() {
  const { t } = useLocale();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("reports");
  const [statusFilter, setStatusFilter] = useState<string>("pending");

  const reports = trpc.moderation.listReports.useQuery(
    { status: statusFilter as "pending" | "reviewed" | "resolved" | "dismissed", limit: 50 },
    { enabled: user?.role === "admin" }
  );

  const suspensions = trpc.moderation.listSuspensions.useQuery(
    { activeOnly: true },
    { enabled: user?.role === "admin" && activeTab === "suspensions" }
  );

  const resolveReport = trpc.moderation.resolveReport.useMutation({
    onSuccess: () => {
      reports.refetch();
      toast.success("Report resolved");
    },
  });

  const suspendUser = trpc.moderation.suspendUser.useMutation({
    onSuccess: () => {
      suspensions.refetch();
      toast.success("User suspended");
    },
  });

  const liftSuspension = trpc.moderation.liftSuspension.useMutation({
    onSuccess: () => {
      suspensions.refetch();
      toast.success("Suspension lifted");
    },
  });

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Shield className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-xl font-bold">Admin Access Required</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          This section is only accessible to community administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-red-50">
          <Shield className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Moderation</h1>
          <p className="text-sm text-muted-foreground">
            Review reports and manage community safety
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-border">
        {[
          { id: "reports" as TabId, label: "Reports", icon: <AlertTriangle className="w-4 h-4" /> },
          { id: "suspensions" as TabId, label: "Suspensions", icon: <Ban className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "text-[#1B1464] border-[#1B1464]"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reports Tab */}
      {activeTab === "reports" && (
        <>
          {/* Status Filter */}
          <div className="flex items-center gap-2 mb-4">
            {["pending", "resolved", "dismissed"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === status
                    ? "bg-[#1B1464] text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Reports List */}
          {reports.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-2xl border border-border animate-pulse">
                  <div className="h-4 w-32 bg-muted rounded mb-2" />
                  <div className="h-3 w-full bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : reports.data?.reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Check className="w-12 h-12 text-green-500 mb-3" />
              <p className="text-lg font-semibold">All clear</p>
              <p className="text-sm text-muted-foreground">
                No {statusFilter} reports to review
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.data?.reports.map((report: any) => (
                <div
                  key={report.id}
                  className="p-4 rounded-2xl border border-border hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-medium text-amber-600 uppercase">
                        {report.reason}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        · {report.contentType}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {report.createdAt
                        ? format(new Date(report.createdAt), "MMM d, h:mm a")
                        : ""}
                    </span>
                  </div>

                  {report.description && (
                    <p className="text-sm text-foreground mb-2">
                      "{report.description}"
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <User className="w-3 h-3" />
                    <span>Reported by user #{report.reporterId}</span>
                    <span>·</span>
                    <span>Content #{report.contentId}</span>
                  </div>

                  {report.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          resolveReport.mutate({
                            reportId: report.id,
                            status: "resolved",
                            resolution: "Content removed by admin",
                            hideContent: true,
                          })
                        }
                        className="rounded-full text-xs"
                        variant="destructive"
                      >
                        <X className="w-3 h-3 mr-1" /> Remove Content
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          resolveReport.mutate({
                            reportId: report.id,
                            status: "dismissed",
                            resolution: "Report dismissed — no violation found",
                          })
                        }
                        className="rounded-full text-xs"
                        variant="outline"
                      >
                        <Check className="w-3 h-3 mr-1" /> Dismiss
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          resolveReport.mutate({
                            reportId: report.id,
                            status: "resolved",
                            resolution: "Warning issued to user",
                          })
                        }
                        className="rounded-full text-xs"
                        variant="outline"
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" /> Warn User
                      </Button>
                    </div>
                  )}

                  {report.status !== "pending" && (
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded-full ${
                          report.status === "resolved"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {report.status}
                      </span>
                      {report.adminNote && (
                        <span className="text-muted-foreground italic">
                          {report.adminNote}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Suspensions Tab */}
      {activeTab === "suspensions" && (
        <>
          {suspensions.isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 rounded-2xl border border-border animate-pulse">
                  <div className="h-4 w-32 bg-muted rounded mb-2" />
                  <div className="h-3 w-full bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : suspensions.data?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Check className="w-12 h-12 text-green-500 mb-3" />
              <p className="text-lg font-semibold">No active suspensions</p>
              <p className="text-sm text-muted-foreground">
                All community members are in good standing
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {suspensions.data?.map((suspension: any) => {
                const isActive =
                  suspension.status === "active" &&
                  (!suspension.expiresAt || new Date(suspension.expiresAt) > new Date());
                return (
                  <div
                    key={suspension.id}
                    className="p-4 rounded-2xl border border-border"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Ban
                          className={`w-4 h-4 ${
                            isActive ? "text-red-500" : "text-gray-400"
                          }`}
                        />
                        <span className="font-semibold text-sm">
                          User #{suspension.userId}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            isActive
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {isActive ? "Active" : "Expired"}
                        </span>
                      </div>
                      {isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            liftSuspension.mutate({ suspensionId: suspension.id })
                          }
                          className="rounded-full text-xs"
                        >
                          Lift Suspension
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {suspension.reason}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Since{" "}
                        {suspension.createdAt
                          ? format(new Date(suspension.createdAt), "MMM d, yyyy")
                          : ""}
                      </span>
                      {suspension.expiresAt && (
                        <span>
                          Expires{" "}
                          {format(new Date(suspension.expiresAt), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
