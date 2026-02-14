import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/i18n/LocaleContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Hash, Lock, Crown, Users, Plus, Loader2, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";

const VISIBILITY_ICONS = {
  public: Hash,
  private: Lock,
  premium: Crown,
};

const VISIBILITY_COLORS = {
  public: "#22C55E",
  private: "#EF4444",
  premium: "#D4AF37",
};

export default function Channels() {
  const { t } = useLocale();
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const { data: allChannels, isLoading } = trpc.channel.list.useQuery();
  const { data: myChannels } = trpc.channel.myChannels.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();

  const joinMutation = trpc.channel.join.useMutation({
    onSuccess: () => {
      toast.success(t.channels.joined + "!");
      utils.channel.list.invalidate();
      utils.channel.myChannels.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const leaveMutation = trpc.channel.leave.useMutation({
    onSuccess: () => {
      toast.success(t.channels.leave + "!");
      utils.channel.list.invalidate();
      utils.channel.myChannels.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const myChannelIds = new Set((myChannels ?? []).map(mc => mc.channel.id));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-[#1B1464]" />
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
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: "#1B1464" }}>
              {t.channels.title}
            </h1>
            <p className="text-muted-foreground">
              {t.channels.subtitle}
            </p>
          </div>
          {user?.role === "admin" && (
            <Button className="rounded-xl" style={{ backgroundColor: "#1B1464" }} onClick={() => toast("Channel creation coming soon")}>
              <Plus className="w-4 h-4 mr-2" /> {t.channels.createChannel}
            </Button>
          )}
        </div>

        {/* {t.channels.myChannels} */}
        {myChannels && myChannels.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" style={{ color: "#D4AF37" }} />
              {t.channels.myChannels}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myChannels.map(({ channel, membership }) => {
                const VisIcon = VISIBILITY_ICONS[channel.visibility ?? "public"];
                const visColor = VISIBILITY_COLORS[channel.visibility ?? "public"];
                return (
                  <Card key={channel.id} className="border hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: visColor + "15" }}>
                          <VisIcon className="w-5 h-5" style={{ color: visColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{channel.name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] capitalize">{membership.role}</Badge>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{channel.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="w-3 h-3" /> {channel.memberCount} {t.channels.members}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => leaveMutation.mutate({ channelId: channel.id })}
                          disabled={leaveMutation.isPending}
                        >
                          {t.channels.leave}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* All Channels */}
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Hash className="w-5 h-5" style={{ color: "#1B1464" }} />
            {t.channels.allChannels}
          </h2>
          {!allChannels || allChannels.length === 0 ? (
            <div className="text-center py-12">
              <Hash className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground">No channels available yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allChannels.map((channel) => {
                const VisIcon = VISIBILITY_ICONS[channel.visibility ?? "public"];
                const visColor = VISIBILITY_COLORS[channel.visibility ?? "public"];
                const isMember = myChannelIds.has(channel.id);

                return (
                  <Card key={channel.id} className="border hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: visColor + "15" }}>
                          <VisIcon className="w-5 h-5" style={{ color: visColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{channel.name}</h3>
                          <Badge variant="outline" className="text-[10px] capitalize">{channel.visibility}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{channel.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="w-3 h-3" /> {channel.memberCount} {t.channels.members}
                        </span>
                        {isMember ? (
                          <Badge variant="secondary" className="text-xs">{t.channels.joined}</Badge>
                        ) : (
                          <Button
                            size="sm"
                            className="rounded-lg text-xs"
                            style={{ backgroundColor: "#1B1464" }}
                            onClick={() => joinMutation.mutate({ channelId: channel.id })}
                            disabled={joinMutation.isPending}
                          >
                            {joinMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : t.channels.join}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
