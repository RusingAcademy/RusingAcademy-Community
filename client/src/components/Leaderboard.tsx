// DESIGN: Premium Leaderboard — podium with gradients, glass cards, gold accents, branded colors
import { motion } from "framer-motion";
import { useLocale } from "@/i18n/LocaleContext";
import { Flame, Trophy, Medal, Crown, Info, Loader2, Zap, Star } from "lucide-react";
import { memberLevels, badges, pointActions, leaderboard as mockLeaderboard } from "@/lib/extendedData";
import { useState, useMemo } from "react";
import { useLeaderboard, useMyStats } from "@/hooks/useCommunityData";
import { useAuth } from "@/_core/hooks/useAuth";

function getLevelColor(level: number) {
  return memberLevels.find((l) => l.level === level)?.color || "#94a3b8";
}
function getLevelIcon(level: number) {
  return memberLevels.find((l) => l.level === level)?.icon || "🌱";
}
function getLevelName(level: number) {
  return memberLevels.find((l) => l.level === level)?.name || "Newcomer";
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #D4AF37, #E8CB6A)", boxShadow: "0 2px 6px rgba(212, 175, 55, 0.25)" }}
      >
        <Crown className="w-4 h-4 text-white" strokeWidth={2.5} />
      </div>
    );
  if (rank === 2)
    return (
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #C0C0C0, #E0E0E0)", boxShadow: "0 2px 6px rgba(192, 192, 192, 0.2)" }}
      >
        <Medal className="w-4 h-4 text-white" strokeWidth={2.5} />
      </div>
    );
  if (rank === 3)
    return (
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #CD7F32, #E8A860)", boxShadow: "0 2px 6px rgba(205, 127, 50, 0.2)" }}
      >
        <Medal className="w-4 h-4 text-white" strokeWidth={2.5} />
      </div>
    );
  return (
    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-muted-foreground" style={{ background: "rgba(27, 20, 100, 0.03)" }}>
      {rank}
    </span>
  );
}

function MemberRow({ member, rank }: { member: { name: string; avatar: string; level: number; points: number; streak: number }; rank: number }) {
  const isTop3 = rank <= 3;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.04 }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
      style={{
        background: isTop3 ? "rgba(212, 175, 55, 0.03)" : "transparent",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(248, 247, 244, 0.8)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = isTop3 ? "rgba(212, 175, 55, 0.03)" : "transparent"; }}
    >
      <RankBadge rank={rank} />
      <div className="avatar-ring">
        <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-foreground truncate tracking-tight">{member.name}</span>
          <span className="text-xs" title={getLevelName(member.level)}>{getLevelIcon(member.level)}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Flame className="w-3 h-3" style={{ color: "#D4AF37" }} />
            {member.streak}d streak
          </span>
        </div>
      </div>
      <div className="text-right">
        <span className="font-bold text-sm" style={{ color: "#1B1464" }}>
          {member.points.toLocaleString()}
        </span>
        <span className="text-[10px] text-muted-foreground ml-1 font-medium">pts</span>
      </div>
    </motion.div>
  );
}

export default function Leaderboard() {
  const { t } = useLocale();
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [period, setPeriod] = useState<"weekly" | "monthly" | "all_time">("weekly");
  const { isAuthenticated } = useAuth();
  const { leaderboard: dbLeaderboard, isLoading } = useLeaderboard(period);
  const { stats } = useMyStats();

  const displayLeaderboard = useMemo(() => {
    if (dbLeaderboard.length > 0) {
      return dbLeaderboard.map((entry) => ({
        name: entry.userName ?? "Anonymous",
        avatar: entry.userAvatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.userId}`,
        level: entry.currentLevel ?? 1,
        points: period === "weekly" ? (entry.weeklyXp ?? 0) : period === "monthly" ? (entry.monthlyXp ?? 0) : (entry.totalXp ?? 0),
        streak: entry.currentStreak ?? 0,
      }));
    }
    return mockLeaderboard.map((m) => ({
      name: m.name, avatar: m.avatar, level: m.level, points: m.points, streak: m.streak,
    }));
  }, [dbLeaderboard, period]);

  const myLevel = stats?.currentLevel ?? 1;
  const myXp = stats?.totalXp ?? 0;
  const nextLevelInfo = memberLevels.find((l) => l.level === myLevel + 1);
  const currentLevelInfo = memberLevels.find((l) => l.level === myLevel);
  const xpToNext = nextLevelInfo ? nextLevelInfo.minPoints - myXp : 0;
  const progressPercent = nextLevelInfo && currentLevelInfo
    ? Math.min(Math.round(((myXp - currentLevelInfo.minPoints) / (nextLevelInfo.minPoints - currentLevelInfo.minPoints)) * 100), 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Your Progress Card — branded gradient */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(27, 20, 100, 0.04), rgba(212, 175, 55, 0.04))",
          border: "1px solid rgba(27, 20, 100, 0.06)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* Decorative orb */}
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-10 blur-3xl" style={{ background: "linear-gradient(135deg, #D4AF37, #1B1464)" }} />

        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: "#D4AF37" }} />
            Your Progress
          </h3>
          <button onClick={() => setShowHowItWorks(!showHowItWorks)} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors font-medium">
            <Info className="w-3.5 h-3.5" /> How it works
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
              style={{
                background: "linear-gradient(135deg, rgba(27, 20, 100, 0.06), rgba(212, 175, 55, 0.06))",
                border: "1px solid rgba(27, 20, 100, 0.06)",
              }}
            >
              {getLevelIcon(myLevel)}
            </div>
            <div
              className="absolute -bottom-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold rounded-md text-white"
              style={{ background: "linear-gradient(135deg, #1B1464, #2D2580)", boxShadow: "0 1px 4px rgba(27, 20, 100, 0.2)" }}
            >
              Lv.{myLevel}
            </div>
          </div>
          <div className="flex-1">
            <p className="font-bold text-foreground">{getLevelName(myLevel)}</p>
            <p className="text-[11px] text-muted-foreground mb-2 font-medium">
              {isAuthenticated
                ? nextLevelInfo
                  ? `${myXp.toLocaleString()} / ${nextLevelInfo.minPoints.toLocaleString()} points to ${nextLevelInfo.name}`
                  : `${myXp.toLocaleString()} points — Max level reached!`
                : "Login to track your progress"}
            </p>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(27, 20, 100, 0.06)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #1B1464, #D4AF37)" }}
                initial={{ width: 0 }}
                animate={{ width: `${isAuthenticated ? progressPercent : 0}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {showHowItWorks && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(27, 20, 100, 0.06)" }}>
            <h4 className="text-xs font-bold uppercase tracking-[0.1em] mb-3" style={{ color: "rgba(27, 20, 100, 0.4)" }}>Earn Points By</h4>
            <div className="grid grid-cols-2 gap-2">
              {pointActions.map((action) => (
                <div key={action.action} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{action.icon}</span>
                  <span className="flex-1">{action.action}</span>
                  <span className="font-bold" style={{ color: "#D4AF37" }}>+{action.points}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Levels Overview — glass card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-2xl p-5"
        style={{ background: "white", border: "1px solid rgba(27, 20, 100, 0.05)", boxShadow: "var(--shadow-card)" }}
      >
        <h3 className="text-xs font-bold uppercase tracking-[0.1em] mb-4" style={{ color: "rgba(27, 20, 100, 0.4)" }}>Levels</h3>
        <div className="space-y-3">
          {memberLevels.map((level) => (
            <div key={level.level} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: level.color + "12", border: `1px solid ${level.color}20` }}>
                {level.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: level.color }}>{level.name}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">{level.minPoints}+ pts</span>
                </div>
                {level.unlocksContent && (
                  <p className="text-[11px] text-muted-foreground">Unlocks: {level.unlocksContent}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Badges Collection — glass card with grid */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="rounded-2xl p-5"
        style={{ background: "white", border: "1px solid rgba(27, 20, 100, 0.05)", boxShadow: "var(--shadow-card)" }}
      >
        <h3 className="text-xs font-bold uppercase tracking-[0.1em] mb-4" style={{ color: "rgba(212, 175, 55, 0.7)" }}>Badges</h3>
        <div className="grid grid-cols-4 gap-3">
          {badges.map((badge) => (
            <motion.div
              key={badge.id}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
              title={badge.description}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all duration-200"
                style={{ background: badge.color + "10", border: `1px solid ${badge.color}18` }}
              >
                {badge.icon}
              </div>
              <span className="text-[10px] text-muted-foreground text-center leading-tight font-medium">{badge.name}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Leaderboard — premium card with branded period tabs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: "white", border: "1px solid rgba(27, 20, 100, 0.05)", boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Trophy className="w-4 h-4" style={{ color: "#D4AF37" }} /> Leaderboard
          </h3>
          <div className="flex items-center gap-1 p-0.5 rounded-xl" style={{ background: "rgba(27, 20, 100, 0.03)" }}>
            {(["weekly", "monthly", "all_time"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="text-[11px] px-3 py-1.5 rounded-lg font-semibold transition-all duration-200"
                style={{
                  background: period === p ? "linear-gradient(135deg, #1B1464, #2D2580)" : "transparent",
                  color: period === p ? "white" : undefined,
                  boxShadow: period === p ? "0 2px 6px rgba(27, 20, 100, 0.15)" : "none",
                }}
              >
                {p === "weekly" ? "Week" : p === "monthly" ? "Month" : "All Time"}
              </button>
            ))}
          </div>
        </div>
        <div className="px-1 pb-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            displayLeaderboard.map((member, i) => (
              <MemberRow key={i} member={member} rank={i + 1} />
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
