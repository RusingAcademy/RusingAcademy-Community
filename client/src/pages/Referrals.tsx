import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/i18n/LocaleContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Users, DollarSign, MousePointerClick, TrendingUp, ArrowLeft, Loader2, Gift, Share2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export default function Referrals() {
  const { t } = useLocale();
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState(false);

  const { data: referralData, isLoading: codeLoading } = trpc.referral.myReferralCode.useQuery(undefined, { enabled: isAuthenticated });
  const { data: stats, isLoading: statsLoading } = trpc.referral.myReferralStats.useQuery(undefined, { enabled: isAuthenticated });
  const { data: myReferrals } = trpc.referral.myReferrals.useQuery(undefined, { enabled: isAuthenticated });

  const referralLink = referralData?.referralCode
    ? `${window.location.origin}?ref=${referralData.referralCode}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success(t.referrals.copied);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Please log in to access your referral dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#D4AF37]/5 to-background">
      <div className="max-w-5xl mx-auto px-4 pt-8 pb-16">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t.membership.backToCommunity}
        </button>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#D4AF37" + "20" }}>
            <Gift className="w-8 h-8" style={{ color: "#D4AF37" }} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: "#1B1464" }}>
            {t.referrals.title}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t.referrals.subtitle}
          </p>
        </div>

        {/* Referral Link Card */}
        <Card className="mb-8 border-2" style={{ borderColor: "#D4AF37" + "40" }}>
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Share2 className="w-5 h-5" style={{ color: "#D4AF37" }} />
              {t.referrals.yourLink}
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-muted rounded-xl px-4 py-3 text-sm font-mono truncate">
                {codeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : referralLink}
              </div>
              <Button
                onClick={copyLink}
                className="rounded-xl shrink-0"
                style={{ backgroundColor: "#D4AF37" }}
              >
                <Copy className="w-4 h-4 mr-2" />
                {copied ? t.referrals.copied : t.referrals.copyLink}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Code: <span className="font-mono font-bold">{referralData?.referralCode ?? "..."}</span>
            </p>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: MousePointerClick, label: "Total Clicks", value: stats?.totalClicks ?? 0, color: "#1B1464" },
            { icon: Users, label: "Referrals", value: stats?.totalReferrals ?? 0, color: "#2EC4B6" },
            { icon: TrendingUp, label: "Conversions", value: stats?.conversions ?? 0, color: "#D4AF37" },
            { icon: DollarSign, label: "Total Earned", value: `$${(stats?.totalCommission ?? 0).toFixed(2)}`, color: "#22C55E" },
          ].map((stat) => (
            <Card key={stat.label} className="border">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: stat.color + "15" }}>
                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pending Commission */}
        {(stats?.pendingCommission ?? 0) > 0 && (
          <Card className="mb-8 bg-green-50 border-green-200">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Pending Commission</p>
                <p className="text-2xl font-bold text-green-600">${(stats?.pendingCommission ?? 0).toFixed(2)}</p>
              </div>
              <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-100 rounded-xl">
                Request Payout
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Referral List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" style={{ color: "#1B1464" }} />
{t.referrals.recentReferrals}
          </CardTitle>
          </CardHeader>
          <CardContent>
            {!myReferrals || myReferrals.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">{t.referrals.noReferrals}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myReferrals.map((ref) => (
                  <div key={ref.referral.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-3">
                      {ref.referredUser?.avatarUrl ? (
                        <img src={ref.referredUser.avatarUrl} alt="" className="w-9 h-9 rounded-full" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#1B1464]/10 flex items-center justify-center text-sm font-bold" style={{ color: "#1B1464" }}>
                          {(ref.referredUser?.name ?? "?")[0]}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">{ref.referredUser?.name ?? "Pending"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(ref.referral.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={ref.referral.status === "converted" ? "default" : "secondary"} className="capitalize">
                        {ref.referral.status}
                      </Badge>
                      {parseFloat(String(ref.referral.commissionAmount ?? "0")) > 0 && (
                        <span className="text-sm font-semibold text-green-600">
                          +${parseFloat(String(ref.referral.commissionAmount)).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* How it works */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-center mb-6" style={{ color: "#1B1464" }}>How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Share Your Link", desc: "Copy your unique referral link and share it with friends, colleagues, or on social media." },
              { step: "2", title: "They Join", desc: "When someone signs up using your link, they're tracked as your referral automatically." },
              { step: "3", title: "Earn Rewards", desc: "Earn 20% commission when your referrals subscribe to a paid plan. Payouts are monthly." },
            ].map((item) => (
              <div key={item.step} className="text-center p-6 bg-card rounded-2xl border">
                <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold" style={{ backgroundColor: "#D4AF37" }}>
                  {item.step}
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
