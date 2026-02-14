// DESIGN: Premium Challenges — glass cards, gradient progress, branded styling, gold accents
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "@/i18n/LocaleContext";
import { Zap, Trophy, Users, Calendar, CheckCircle2, Circle, ArrowLeft, Gift, Flame, Clock, Target, Repeat } from "lucide-react";
import { challenges as mockChallenges, type Challenge as MockChallenge } from "@/lib/extendedData";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface DisplayChallenge {
  id: number;
  name: string;
  nameFr: string | null;
  description: string | null;
  descriptionFr: string | null;
  type: string;
  targetCount: number;
  pointsReward: number;
  period: string;
  imageUrl: string | null;
  startAt: Date | null;
  endAt: Date | null;
  isJoined: boolean;
  currentProgress: number;
  status: "active" | "completed" | "upcoming";
}

const periodLabels: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  one_time: "One-time",
};

const typeIcons: Record<string, typeof Zap> = {
  posts: Zap,
  comments: Zap,
  streak: Flame,
  events: Calendar,
  courses: Target,
  corrections: CheckCircle2,
};

function ChallengeCard({ challenge, onSelect }: { challenge: DisplayChallenge; onSelect: (c: DisplayChallenge) => void }) {
  const progress = challenge.targetCount > 0 ? Math.round((challenge.currentProgress / challenge.targetCount) * 100) : 0;
  const TypeIcon = typeIcons[challenge.type] || Zap;

  const statusConfig = {
    active: { bg: "rgba(34, 197, 94, 0.08)", border: "rgba(34, 197, 94, 0.15)", text: "#16a34a", label: "Active" },
    upcoming: { bg: "rgba(59, 130, 246, 0.08)", border: "rgba(59, 130, 246, 0.15)", text: "#2563eb", label: "Upcoming" },
    completed: { bg: "rgba(212, 175, 55, 0.08)", border: "rgba(212, 175, 55, 0.15)", text: "#D4AF37", label: "Completed" },
  };
  const status = statusConfig[challenge.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(27, 20, 100, 0.08)" }}
      className="rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300"
      style={{
        background: "white",
        border: "1px solid rgba(27, 20, 100, 0.05)",
        boxShadow: "var(--shadow-card)",
      }}
      onClick={() => onSelect(challenge)}
    >
      <div className="relative h-36 overflow-hidden flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1B1464, #2D2580, rgba(212, 175, 55, 0.4))" }}>
        {challenge.imageUrl ? (
          <img src={challenge.imageUrl} alt={challenge.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <TypeIcon className="w-12 h-12 text-white/20" />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.5) 100%)" }} />
        <div className="absolute top-3 left-3">
          <span
            className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm"
            style={{ background: status.bg, color: status.text, border: `1px solid ${status.border}` }}
          >
            {status.label}
          </span>
        </div>
        <div
          className="absolute top-3 right-3 rounded-lg px-2.5 py-1 flex items-center gap-1 text-[10px] font-bold text-white backdrop-blur-sm"
          style={{ background: "rgba(212, 175, 55, 0.85)" }}
        >
          <Trophy className="w-3 h-3" /> {challenge.pointsReward} pts
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-bold text-sm mb-1 tracking-tight">{challenge.name}</h3>
          <div className="flex items-center gap-3 text-white/70 text-[11px]">
            <span className="flex items-center gap-1"><Repeat className="w-3 h-3" />{periodLabels[challenge.period] || challenge.period}</span>
            <span className="flex items-center gap-1"><Target className="w-3 h-3" />{challenge.targetCount} target</span>
          </div>
        </div>
      </div>
      <div className="p-4">
        <p className="text-[11px] text-muted-foreground mb-3 line-clamp-2 leading-relaxed">{challenge.description}</p>
        {challenge.isJoined && (
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-muted-foreground font-medium">{challenge.currentProgress}/{challenge.targetCount}</span>
              <span className="font-bold" style={{ color: progress === 100 ? "#D4AF37" : "#1B1464" }}>{progress}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(27, 20, 100, 0.04)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: progress === 100 ? "linear-gradient(90deg, #D4AF37, #E8CB6A)" : "linear-gradient(90deg, #1B1464, #2D2580)" }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
        {!challenge.isJoined && challenge.status === "active" && (
          <div className="text-[11px] font-bold flex items-center gap-1" style={{ color: "#1B1464" }}>
            Join to start tracking <span className="transition-transform group-hover:translate-x-1">→</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ChallengeDetail({ challenge, onBack }: { challenge: DisplayChallenge; onBack: () => void }) {
  const { isAuthenticated } = useAuth();
  const progress = challenge.targetCount > 0 ? Math.round((challenge.currentProgress / challenge.targetCount) * 100) : 0;
  const TypeIcon = typeIcons[challenge.type] || Zap;

  const joinMutation = trpc.challenges.join.useMutation({
    onSuccess: () => toast.success("Challenge joined! Let's go!"),
    onError: () => toast.error("Failed to join challenge"),
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to challenges
      </button>

      <div className="relative rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="w-full h-48 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1B1464, #2D2580, rgba(212, 175, 55, 0.4))" }}>
          {challenge.imageUrl ? (
            <img src={challenge.imageUrl} alt={challenge.name} className="w-full h-full object-cover" />
          ) : (
            <TypeIcon className="w-16 h-16 text-white/20" />
          )}
        </div>
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.6) 100%)" }} />
        <div className="absolute bottom-4 left-4 right-4">
          <h2 className="text-white font-bold text-lg mb-1 tracking-tight">{challenge.name}</h2>
          <div className="flex items-center gap-3 text-white/70 text-[11px] font-medium">
            <span>{periodLabels[challenge.period]}</span>
            <span className="opacity-40">·</span>
            <span>{challenge.targetCount} target</span>
            <span className="opacity-40">·</span>
            <span>{challenge.pointsReward} points reward</span>
          </div>
        </div>
      </div>

      {challenge.isJoined && (
        <div
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(27, 20, 100, 0.04), rgba(212, 175, 55, 0.04))",
            border: "1px solid rgba(27, 20, 100, 0.06)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-10 blur-2xl" style={{ background: "linear-gradient(135deg, #D4AF37, #1B1464)" }} />
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5" style={{ color: "#D4AF37" }} />
              <span className="font-bold text-foreground">Your Progress</span>
            </div>
            <span className="text-lg font-bold" style={{ color: progress === 100 ? "#D4AF37" : "#1B1464" }}>{progress}%</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden mb-2" style={{ background: "rgba(27, 20, 100, 0.04)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: progress === 100 ? "linear-gradient(90deg, #D4AF37, #E8CB6A)" : "linear-gradient(90deg, #1B1464, #2D2580)" }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">{challenge.currentProgress} of {challenge.targetCount} completed</p>
        </div>
      )}

      <div
        className="rounded-xl p-4 flex items-center gap-3"
        style={{
          background: "linear-gradient(135deg, rgba(212, 175, 55, 0.06), rgba(212, 175, 55, 0.02))",
          border: "1px solid rgba(212, 175, 55, 0.1)",
        }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #D4AF37, #E8CB6A)" }}>
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Reward: {challenge.pointsReward} XP Points</p>
          <p className="text-[11px] text-muted-foreground">Complete this challenge to earn points and climb the leaderboard</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{challenge.description}</p>

      {challenge.descriptionFr && (
        <div className="rounded-xl p-4" style={{ background: "rgba(27, 20, 100, 0.02)", border: "1px solid rgba(27, 20, 100, 0.04)" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">En français :</p>
          <p className="text-sm text-foreground leading-relaxed">{challenge.descriptionFr}</p>
        </div>
      )}

      {!challenge.isJoined && challenge.status === "active" && (
        <Button
          onClick={() => {
            if (!isAuthenticated) { toast("Please log in to join challenges"); return; }
            joinMutation.mutate({ challengeId: challenge.id });
          }}
          disabled={joinMutation.isPending}
          className="w-full rounded-xl font-bold text-white border-0 transition-all duration-300 hover:shadow-md active:scale-[0.97]"
          style={{ background: "linear-gradient(135deg, #1B1464, #2D2580)", boxShadow: "0 2px 8px rgba(27, 20, 100, 0.15)" }}
        >
          {joinMutation.isPending ? "Joining..." : "Join This Challenge"}
        </Button>
      )}
    </motion.div>
  );
}

export default function Challenges() {
  const { t } = useLocale();
  const { isAuthenticated } = useAuth();
  const challengesQuery = trpc.challenges.list.useQuery({ limit: 20 });
  const myChallengesQuery = trpc.challenges.myChallenges.useQuery(undefined, { enabled: isAuthenticated });

  const [selectedChallenge, setSelectedChallenge] = useState<DisplayChallenge | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const displayChallenges: DisplayChallenge[] = useMemo(() => {
    if (!challengesQuery.data || challengesQuery.data.length === 0) {
      return mockChallenges.map((c, idx) => ({
        id: idx + 1,
        name: c.title,
        nameFr: null,
        description: c.description,
        descriptionFr: null,
        type: "streak",
        targetCount: c.daysTotal,
        pointsReward: 100,
        period: "one_time",
        imageUrl: null,
        startAt: null,
        endAt: null,
        isJoined: c.status === "active",
        currentProgress: c.daysCompleted,
        status: c.status as "active" | "completed" | "upcoming",
      }));
    }

    const myChallenges = myChallengesQuery.data || [];
    const now = new Date();

    return challengesQuery.data.map((ch) => {
      const myChallenge = myChallenges.find((mc) => mc.challengeId === ch.id);
      let status: "active" | "completed" | "upcoming" = "active";
      if (ch.startAt && new Date(ch.startAt) > now) status = "upcoming";
      if (myChallenge?.status === "completed") status = "completed";

      return {
        id: ch.id, name: ch.name, nameFr: ch.nameFr, description: ch.description, descriptionFr: ch.descriptionFr,
        type: ch.type, targetCount: ch.targetCount, pointsReward: ch.pointsReward, period: ch.period,
        imageUrl: ch.imageUrl, startAt: ch.startAt, endAt: ch.endAt,
        isJoined: !!myChallenge, currentProgress: myChallenge?.currentProgress ?? 0, status,
      };
    });
  }, [challengesQuery.data, myChallengesQuery.data]);

  if (selectedChallenge) {
    return <ChallengeDetail challenge={selectedChallenge} onBack={() => setSelectedChallenge(null)} />;
  }

  const filtered = filter === "all" ? displayChallenges : displayChallenges.filter((c) => c.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Challenges</h2>
          <p className="text-sm text-muted-foreground">Time-bound activities to boost your skills</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 p-0.5 rounded-xl w-fit" style={{ background: "rgba(27, 20, 100, 0.03)" }}>
        {["all", "active", "upcoming", "completed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200"
            style={{
              background: filter === f ? "linear-gradient(135deg, #1B1464, #2D2580)" : "transparent",
              color: filter === f ? "white" : undefined,
              boxShadow: filter === f ? "0 2px 6px rgba(27, 20, 100, 0.15)" : "none",
            }}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {challengesQuery.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: "white", border: "1px solid rgba(27, 20, 100, 0.05)" }}>
              <div className="h-36" style={{ background: "rgba(27, 20, 100, 0.04)" }} />
              <div className="p-4 space-y-2">
                <div className="h-3 rounded w-full" style={{ background: "rgba(27, 20, 100, 0.04)" }} />
                <div className="h-3 rounded w-2/3" style={{ background: "rgba(27, 20, 100, 0.04)" }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} onSelect={setSelectedChallenge} />
          ))}
        </div>
      )}

      {!challengesQuery.isLoading && filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: "rgba(27, 20, 100, 0.03)" }}>
            <Zap className="w-8 h-8 text-muted-foreground opacity-30" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">No challenges found</p>
        </div>
      )}
    </div>
  );
}
