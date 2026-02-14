import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/i18n/LocaleContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Mail, Send, Plus, Loader2, Trash2, Edit, BarChart3, Users, Eye } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  draft: "#6B7280",
  scheduled: "#3B82F6",
  sending: "#F59E0B",
  sent: "#22C55E",
  failed: "#EF4444",
};

export default function EmailBroadcasts() {
  const { t } = useLocale();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [subject, setSubject] = useState("");
  const [subjectFr, setSubjectFr] = useState("");
  const [body, setBody] = useState("");
  const [bodyFr, setBodyFr] = useState("");

  const { data: broadcasts, isLoading } = trpc.emailBroadcast.list.useQuery();
  const { data: stats } = trpc.emailBroadcast.stats.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.emailBroadcast.create.useMutation({
    onSuccess: () => {
      toast.success("Broadcast created!");
      setShowCreate(false);
      setSubject(""); setSubjectFr(""); setBody(""); setBodyFr("");
      utils.emailBroadcast.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const sendMutation = trpc.emailBroadcast.send.useMutation({
    onSuccess: (data) => {
      toast.success(`Broadcast sent to ${data.recipientCount} recipients!`);
      utils.emailBroadcast.list.invalidate();
      utils.emailBroadcast.stats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.emailBroadcast.delete.useMutation({
    onSuccess: () => {
      toast.success("Broadcast deleted");
      utils.emailBroadcast.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B1464]/5 to-background">
      <div className="max-w-5xl mx-auto px-4 pt-8 pb-16">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t.membership.backToCommunity}
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: "#1B1464" }}>
              {t.emailBroadcasts.title}
            </h1>
            <p className="text-muted-foreground">{t.emailBroadcasts.subtitle}</p>
          </div>
          <Button className="rounded-xl" style={{ backgroundColor: "#1B1464" }} onClick={() => setShowCreate(!showCreate)}>
            <Plus className="w-4 h-4 mr-2" /> {t.emailBroadcasts.compose}
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Sent", value: stats.totalSent, icon: Send, color: "#22C55E" },
              { label: "Drafts", value: stats.totalDrafts, icon: Edit, color: "#6B7280" },
              { label: "Recipients", value: stats.totalRecipients, icon: Users, color: "#1B1464" },
              { label: "Avg Open Rate", value: `${stats.avgOpenRate}%`, icon: Eye, color: "#D4AF37" },
            ].map((stat) => (
              <Card key={stat.label} className="border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.color + "15" }}>
                    <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Form */}
        {showCreate && (
          <Card className="mb-8 border-2" style={{ borderColor: "#1B1464" + "30" }}>
            <CardHeader>
              <CardTitle className="text-lg">Create New Broadcast</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Subject (EN)</label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject line..."
                    className="w-full px-4 py-2.5 rounded-xl border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B1464]/30"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Subject (FR)</label>
                  <input
                    value={subjectFr}
                    onChange={(e) => setSubjectFr(e.target.value)}
                    placeholder="Objet du courriel..."
                    className="w-full px-4 py-2.5 rounded-xl border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B1464]/30"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Body (EN)</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your email content..."
                  className="w-full h-32 px-4 py-3 rounded-xl border bg-muted/30 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1B1464]/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Body (FR)</label>
                <textarea
                  value={bodyFr}
                  onChange={(e) => setBodyFr(e.target.value)}
                  placeholder="Rédigez le contenu du courriel..."
                  className="w-full h-32 px-4 py-3 rounded-xl border bg-muted/30 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1B1464]/30"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" className="rounded-xl" onClick={() => setShowCreate(false)}>{t.common.cancel}</Button>
                <Button
                  className="rounded-xl"
                  style={{ backgroundColor: "#1B1464" }}
                  onClick={() => createMutation.mutate({ subject, subjectFr, body, bodyFr })}
                  disabled={createMutation.isPending || !subject || !body}
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  {t.emailBroadcasts.draft}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Broadcasts List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#1B1464]" />
          </div>
        ) : !broadcasts || broadcasts.length === 0 ? (
          <div className="text-center py-16">
            <Mail className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">No broadcasts yet. Create your first one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {broadcasts.map((broadcast) => (
              <Card key={broadcast.id} className="border hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate">{broadcast.subject}</h3>
                        <Badge
                          variant="outline"
                          className="text-[10px] capitalize shrink-0"
                          style={{ color: STATUS_COLORS[broadcast.status ?? "draft"], borderColor: STATUS_COLORS[broadcast.status ?? "draft"] }}
                        >
                          {broadcast.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{broadcast.body}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{broadcast.recipientCount} recipients</span>
                        {broadcast.sentAt && <span>Sent {new Date(broadcast.sentAt).toLocaleDateString()}</span>}
                        <span>Created {new Date(broadcast.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {broadcast.status === "draft" && (
                        <>
                          <Button
                            size="sm"
                            className="rounded-lg text-xs"
                            style={{ backgroundColor: "#22C55E" }}
                            onClick={() => sendMutation.mutate({ id: broadcast.id })}
                            disabled={sendMutation.isPending}
                          >
                            <Send className="w-3 h-3 mr-1" /> Send
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => deleteMutation.mutate({ id: broadcast.id })}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
