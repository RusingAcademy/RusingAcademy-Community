import { useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/i18n/LocaleContext";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Edit3,
  MapPin,
  Calendar,
  Award,
  BookOpen,
  MessageCircle,
  ThumbsUp,
  Loader2,
  Globe,
  Star,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function UserProfile() {
  const { t } = useLocale();
  const [, params] = useRoute("/profile/:id");
  const [, navigate] = useLocation();
  const { user: currentUser, isAuthenticated } = useAuth();
  const profileId = Number(params?.id);
  const isOwnProfile = currentUser?.id === profileId;

  // Fetch user profile data
  const { data: profile, isLoading } = trpc.gamification.myStats.useQuery(undefined, {
    enabled: isOwnProfile && isAuthenticated,
  });

  const { data: leaderboard } = trpc.gamification.leaderboard.useQuery(
    { period: "all_time", limit: 100 },
    { staleTime: 60_000 }
  );

  const userRank = useMemo(() => {
    if (!leaderboard || !profileId) return null;
    const idx = leaderboard.findIndex((u: any) => u.userId === profileId);
    return idx >= 0 ? idx + 1 : null;
  }, [leaderboard, profileId]);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [nativeLanguage, setNativeLanguage] = useState("");
  const [learningLanguage, setLearningLanguage] = useState("");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  const stats = profile;
  const levelProgress = stats
    ? Math.min(100, ((stats.totalXp ?? 0) / getXpForNextLevel(stats.currentLevel ?? 1)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-[720px] mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-full hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <span className="text-sm font-semibold text-foreground">Profile</span>
        </div>
      </header>

      <main className="max-w-[720px] mx-auto px-4 py-6">
        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border overflow-hidden"
        >
          {/* Banner */}
          <div
            className="h-32 relative"
            style={{
              background: "linear-gradient(135deg, #1B1464 0%, #2D2494 50%, #D4AF37 100%)",
            }}
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10" />
          </div>

          {/* Avatar & Info */}
          <div className="px-6 pb-6 -mt-12 relative">
            <div className="flex items-end gap-4 mb-4">
              <img
                src={
                  currentUser?.avatarUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileId}`
                }
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover ring-4 ring-card border-2 border-[#D4AF37]"
              />
              <div className="flex-1 pb-1">
                <h1 className="text-xl font-bold text-foreground">
                  {currentUser?.name || "Community Member"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {currentUser?.email || ""}
                </p>
              </div>
              {isOwnProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="rounded-full"
                >
                  <Edit3 className="w-4 h-4 mr-1.5" />
                  {isEditing ? "Cancel" : "Edit Profile"}
                </Button>
              )}
            </div>

            {/* Bio Section */}
            {isEditing ? (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell the community about yourself..."
                    className="w-full bg-accent/50 rounded-xl px-4 py-3 text-sm outline-none resize-none min-h-[80px]"
                    maxLength={500}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Location</label>
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., Ottawa, Canada"
                      className="w-full bg-accent/50 rounded-xl px-4 py-2.5 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Native Language</label>
                    <input
                      value={nativeLanguage}
                      onChange={(e) => setNativeLanguage(e.target.value)}
                      placeholder="e.g., English"
                      className="w-full bg-accent/50 rounded-xl px-4 py-2.5 text-sm outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Learning</label>
                  <input
                    value={learningLanguage}
                    onChange={(e) => setLearningLanguage(e.target.value)}
                    placeholder="e.g., French"
                    className="w-full bg-accent/50 rounded-xl px-4 py-2.5 text-sm outline-none"
                  />
                </div>
                <Button
                  onClick={() => {
                    toast.success("Profile updated (feature coming soon)");
                    setIsEditing(false);
                  }}
                  className="rounded-full text-white"
                  style={{ backgroundColor: "#1B1464" }}
                  size="sm"
                >
                  <Check className="w-4 h-4 mr-1.5" /> Save Changes
                </Button>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {bio && <p className="text-sm text-foreground">{bio}</p>}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Joined{" "}
                    {currentUser?.createdAt
                      ? new Date(currentUser.createdAt).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })
                      : "recently"}
                  </span>
                  {nativeLanguage && (
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" /> {nativeLanguage}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3">
              <StatCard
                icon={<Star className="w-4 h-4 text-[#D4AF37]" />}
                label="XP"
                value={stats?.totalXp?.toLocaleString() ?? "0"}
              />
              <StatCard
                icon={<Award className="w-4 h-4 text-[#1B1464]" />}
                label="Level"
                value={`${stats?.currentLevel ?? 1}`}
                sublabel={stats?.levelTitle ?? "Beginner"}
              />
              <StatCard
                icon={<BookOpen className="w-4 h-4 text-green-500" />}
                label="Badges"
                value={`${stats?.badges?.length ?? 0}`}
              />
              <StatCard
                icon={<ThumbsUp className="w-4 h-4 text-blue-500" />}
                label="Rank"
                value={userRank ? `#${userRank}` : "—"}
              />
            </div>

            {/* XP Progress Bar */}
            {stats && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Level {stats.currentLevel ?? 1}: {stats.levelTitle ?? "Beginner"}</span>
                  <span>{stats.totalXp ?? 0} / {getXpForNextLevel(stats.currentLevel ?? 1)} XP</span>
                </div>
                <div className="h-2 bg-accent rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${levelProgress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{
                      background: "linear-gradient(90deg, #1B1464, #D4AF37)",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Activity Section */}
        <div className="mt-6 bg-card rounded-2xl border border-border p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Recent Activity</h2>
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Activity feed coming soon</p>
            <p className="text-xs mt-1">Posts, comments, and achievements will appear here</p>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sublabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div className="bg-accent/50 rounded-xl p-3 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{sublabel || label}</p>
    </div>
  );
}

function getXpForNextLevel(currentLevel: number): number {
  const thresholds = [100, 350, 700, 1200, 2000, 3500, 5000, 7500, 10000, 15000];
  return thresholds[Math.min(currentLevel, thresholds.length - 1)] ?? 15000;
}
