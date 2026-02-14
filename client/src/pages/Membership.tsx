import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/i18n/LocaleContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Crown, Star, Zap, ArrowLeft, Loader2, ExternalLink, CreditCard } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";

const TIER_ICONS: Record<string, typeof Crown> = {
  free: Star,
  pro: Zap,
  enterprise: Crown,
};

const TIER_COLORS: Record<string, string> = {
  free: "#1B1464",
  pro: "#D4AF37",
  enterprise: "#8B5CF6",
};

export default function Membership() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const { t } = useLocale();

  const { data: tiers, isLoading: tiersLoading } = trpc.membership.listTiers.useQuery();
  const { data: mySub, refetch: refetchSub } = trpc.membership.mySubscription.useQuery(undefined, { enabled: isAuthenticated });

  const checkoutMutation = trpc.membership.createCheckoutSession.useMutation({
    onSuccess: (data: { checkoutUrl: string | null }) => {
      if (data.checkoutUrl) {
        toast.info(t.membership.redirectingToCheckout);
        window.open(data.checkoutUrl, "_blank");
      }
    },
    onError: (err: any) => toast.error(err.message),
  });

  const portalMutation = trpc.membership.createPortalSession.useMutation({
    onSuccess: (data: { portalUrl: string }) => {
      if (data.portalUrl) {
        window.open(data.portalUrl, "_blank");
      }
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Handle Stripe redirect status
  useEffect(() => {
    const params = new URLSearchParams(search);
    const status = params.get("status");
    if (status === "success") {
      toast.success(t.membership.paymentSuccess);
      refetchSub();
    } else if (status === "cancelled") {
      toast.info(t.membership.checkoutCancelled);
    }
  }, [search]);

  const handleSubscribe = (tierId: number, billingCycle: "monthly" | "yearly") => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    checkoutMutation.mutate({ tierId, billingCycle });
  };

  const handleManageSubscription = () => {
    portalMutation.mutate();
  };

  if (tiersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-[#1B1464]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B1464]/5 to-background">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t.membership.backToCommunity}
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight mb-3" style={{ color: "#1B1464" }}>
            {t.membership.title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.membership.subtitle}
          </p>
          {mySub && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <Badge className="bg-green-100 text-green-700 border-green-300 px-4 py-1.5 text-sm">
                {t.membership.currentPlan}: {mySub.tier.name}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full gap-2"
                onClick={handleManageSubscription}
                disabled={portalMutation.isPending}
              >
                {portalMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                {t.membership.manageSubscription}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          {(tiers ?? []).map((tier) => {
            const Icon = TIER_ICONS[tier.slug] ?? Star;
            const color = TIER_COLORS[tier.slug] ?? "#1B1464";
            const isCurrentTier = mySub?.tier?.id === tier.id;
            const features = (tier.features as string[]) ?? [];
            const isPopular = tier.slug === "pro";
            const isFree = tier.slug === "free" || parseFloat(tier.priceMonthly ?? "0") === 0;

            return (
              <Card
                key={tier.id}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  isPopular ? "border-2 ring-2 ring-offset-2" : "border"
                } ${isCurrentTier ? "border-green-500" : ""}`}
                style={isPopular ? { borderColor: color } : {}}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 px-4 py-1 text-xs font-bold text-white rounded-bl-lg" style={{ backgroundColor: color }}>
                    {t.membership.mostPopular}
                  </div>
                )}
                {isCurrentTier && (
                  <div className="absolute top-0 left-0 px-4 py-1 text-xs font-bold text-white rounded-br-lg bg-green-500">
                    {t.membership.currentPlanBadge}
                  </div>
                )}

                <CardHeader className="text-center pt-8">
                  <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: `${color}15` }}>
                    <Icon className="w-7 h-7" style={{ color }} />
                  </div>
                  <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                  <CardDescription className="text-sm mt-1">{tier.description}</CardDescription>
                </CardHeader>

                <CardContent className="text-center">
                  <div className="mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-extrabold" style={{ color }}>
                        {isFree ? "Free" : `$${tier.priceMonthly}`}
                      </span>
                      {!isFree && <span className="text-muted-foreground text-sm">/month</span>}
                    </div>
                    {!isFree && parseFloat(tier.priceYearly ?? "0") > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        or ${tier.priceYearly}/year (save {Math.round((1 - parseFloat(tier.priceYearly ?? "0") / (parseFloat(tier.priceMonthly ?? "0") * 12)) * 100)}%)
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 text-left">
                    {features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color }} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="flex flex-col gap-2 pb-8">
                  {isCurrentTier ? (
                    <Badge variant="outline" className="w-full justify-center py-2 text-green-600 border-green-300">
                      {t.membership.activePlan}
                    </Badge>
                  ) : isFree ? (
                    <Button
                      variant="outline"
                      className="w-full rounded-xl"
                      onClick={() => {
                        if (!isAuthenticated) {
                          window.location.href = getLoginUrl();
                        } else {
                          toast.info(t.membership.freeAccess);
                        }
                      }}
                    >
                      {t.membership.getStartedFree}
                    </Button>
                  ) : (
                    <>
                      <Button
                        className="w-full rounded-xl font-semibold text-white gap-2"
                        style={{ backgroundColor: color }}
                        onClick={() => handleSubscribe(tier.id, "monthly")}
                        disabled={checkoutMutation.isPending}
                      >
                        {checkoutMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                        {t.membership.subscribeMonthly}
                      </Button>
                      {parseFloat(tier.priceYearly ?? "0") > 0 && (
                        <Button
                          variant="outline"
                          className="w-full rounded-xl text-sm gap-2"
                          onClick={() => handleSubscribe(tier.id, "yearly")}
                          disabled={checkoutMutation.isPending}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          {t.membership.subscribeYearly}
                        </Button>
                      )}
                    </>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Payment History */}
        {isAuthenticated && <PaymentHistory />}

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8" style={{ color: "#1B1464" }}>
            {t.membership.faq}
          </h2>
          <div className="space-y-4">
            {[
              { q: "Can I switch plans anytime?", a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately." },
              { q: "Is there a free trial?", a: "The Free plan gives you access to core community features. Upgrade when you're ready for premium content." },
              { q: "What payment methods are accepted?", a: "We accept all major credit cards, debit cards, and digital wallets through Stripe's secure payment processor." },
              { q: "Can I cancel my subscription?", a: "Yes, you can cancel anytime from the Manage Subscription portal. You'll retain access until the end of your billing period." },
              { q: "Is my payment information secure?", a: "Absolutely. All payments are processed by Stripe, a PCI Level 1 certified payment processor. We never store your card details." },
            ].map((faq, i) => (
              <div key={i} className="bg-card rounded-xl p-5 border">
                <h3 className="font-semibold text-foreground mb-1">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Test Mode Notice */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            {t.membership.testCard} <code className="bg-muted px-1.5 py-0.5 rounded text-xs">4242 4242 4242 4242</code> {t.membership.forTesting}
          </p>
        </div>
      </div>
    </div>
  );
}

function PaymentHistory() {
  const { t } = useLocale();
  const { data: payments, isLoading } = trpc.membership.myPayments.useQuery({ limit: 5 });

  if (isLoading || !payments?.length) return null;

  return (
    <div className="mt-12 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4" style={{ color: "#1B1464" }}>{t.membership.recentPayments}</h2>
      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="px-4 py-3">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">{p.description ?? "Subscription payment"}</td>
                <td className="px-4 py-3 text-right font-medium">${p.amount} {p.currency}</td>
                <td className="px-4 py-3 text-right">
                  <Badge variant={p.status === "succeeded" ? "default" : "secondary"} className="text-xs">
                    {p.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
