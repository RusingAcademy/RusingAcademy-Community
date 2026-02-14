// DESIGN: Premium glassmorphism sidebar — Navy #1B1464 + Gold #D4AF37
// Elevated visual hierarchy, animated active states, section dividers
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useLocale } from "@/i18n/LocaleContext";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Home, Trophy, BookOpen, CalendarDays, Zap, PenLine,
  MessageCircle, GraduationCap, Mail, Search, Shield, BarChart3,
  Crown, Gift, Sparkles, Hash, Award, DollarSign, ExternalLink,
} from "lucide-react";
import WebSocketStatus from "@/components/WebSocketStatus";

export type PageId = "community" | "leaderboard" | "classroom" | "events" | "challenges" | "notebook" | "messages" | "moderation" | "analytics" | "membership" | "referrals" | "ai-assistant" | "channels" | "certificates" | "email-broadcasts" | "revenue" | "courses" | "admin-courses";

interface NavItem {
  icon: typeof Home;
  labelKey: string;
  page: PageId;
  route?: string;
  adminOnly?: boolean;
  premium?: boolean;
}

const navSections: { titleKey: string; items: NavItem[] }[] = [
  {
    titleKey: "community",
    items: [
      { icon: MessageCircle, labelKey: "feed", page: "community" },
      { icon: Hash, labelKey: "channels", page: "channels", route: "/channels" },
      { icon: Trophy, labelKey: "leaderboard", page: "leaderboard" },
      { icon: PenLine, labelKey: "notebook", page: "notebook" },
      { icon: Mail, labelKey: "messages", page: "messages", route: "/messages" },
    ],
  },
  {
    titleKey: "learn",
    items: [
      { icon: BookOpen, labelKey: "classroom", page: "classroom" },
      { icon: GraduationCap, labelKey: "courses", page: "courses" as PageId, route: "/courses" },
      { icon: Zap, labelKey: "challenges", page: "challenges" },
      { icon: CalendarDays, labelKey: "events", page: "events" },
      { icon: Sparkles, labelKey: "aiAssistant", page: "ai-assistant", route: "/ai-assistant" },
      { icon: Award, labelKey: "certificates", page: "certificates", route: "/certificates" },
    ],
  },
  {
    titleKey: "account",
    items: [
      { icon: Crown, labelKey: "membership", page: "membership", route: "/membership", premium: true },
      { icon: Gift, labelKey: "referrals", page: "referrals", route: "/referrals" },
    ],
  },
  {
    titleKey: "admin",
    items: [
      { icon: Shield, labelKey: "moderation", page: "moderation", route: "/moderation", adminOnly: true },
      { icon: BarChart3, labelKey: "analytics", page: "analytics", route: "/analytics", adminOnly: true },
      { icon: DollarSign, labelKey: "revenue", page: "revenue", route: "/revenue", adminOnly: true },
      { icon: Mail, labelKey: "broadcasts", page: "email-broadcasts", route: "/email-broadcasts", adminOnly: true },
      { icon: BookOpen, labelKey: "courseBuilder", page: "admin-courses" as PageId, route: "/admin/courses", adminOnly: true },
    ],
  },
];

const RA_LOGO = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663049070748/mRLHZFARZiUVtNTg.png";

interface LeftSidebarProps {
  activePage: PageId;
  onPageChange: (page: PageId) => void;
}

export default function LeftSidebar({ activePage, onPageChange }: LeftSidebarProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { t } = useLocale();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const getNavLabel = (key: string): string => {
    return (t.nav as Record<string, string>)[key] ?? key;
  };

  const handleNavClick = (item: NavItem) => {
    if (item.route) {
      navigate(item.route);
    } else {
      if (window.location.pathname !== "/") {
        navigate("/");
      }
      onPageChange(item.page);
    }
  };

  return (
    <aside
      role="navigation"
      aria-label="Main navigation"
      className="hidden lg:flex flex-col w-[240px] shrink-0 sticky top-0 h-screen overflow-y-auto"
      style={{
        background: isDark
          ? "linear-gradient(180deg, rgba(22,22,40,0.97) 0%, rgba(26,26,46,0.99) 100%)"
          : "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,247,244,0.98) 100%)",
        borderRight: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid rgba(27, 20, 100, 0.06)",
        boxShadow: isDark ? "4px 0 24px rgba(0, 0, 0, 0.15)" : "4px 0 24px rgba(15, 10, 60, 0.03)",
      }}
    >
      {/* Logo Section */}
      <div
        className="px-4 pt-5 pb-4 mb-1 cursor-pointer group"
        onClick={() => { navigate("/"); onPageChange("community"); }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={RA_LOGO}
              alt="RusingAcademy"
              className="w-10 h-10 rounded-xl object-contain transition-transform duration-300 group-hover:scale-105"
              style={{ boxShadow: "0 2px 8px rgba(27, 20, 100, 0.1)" }}
            />
            <div
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
              style={{ background: "linear-gradient(135deg, #D4AF37, #E8CB6A)" }}
            />
          </div>
          <div className="leading-tight">
            <div className="flex items-baseline">
              <span className="text-[15px] font-extrabold tracking-tight" style={{ color: isDark ? "#A5A4FF" : "#1B1464" }}>
                Rusing
              </span>
              <span className="text-[15px] font-extrabold tracking-tight" style={{ color: isDark ? "#E8CB6A" : "#D4AF37" }}>
                Academy
              </span>
            </div>
            <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: isDark ? "rgba(165, 164, 255, 0.4)" : "rgba(27, 20, 100, 0.35)" }}>
              {t.nav.communityHub}
            </p>
          </div>
        </div>
      </div>

      {/* Gold accent divider */}
      <div className="mx-4 mb-3 divider-gold" />

      {/* Nav Sections */}
      <nav className="flex flex-col gap-5 px-3 flex-1">
        {navSections.map((section, sectionIndex) => {
          const visibleItems = section.items.filter(
            (item) => !item.adminOnly || user?.role === "admin"
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.titleKey}>
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: isDark ? "rgba(165, 164, 255, 0.35)" : "rgba(27, 20, 100, 0.3)" }}>
                {getNavLabel(section.titleKey)}
              </p>
              <div className="flex flex-col gap-0.5">
                {visibleItems.map((item) => {
                  const isActive = activePage === item.page;
                  return (
                    <button
                      key={item.page}
                      onClick={() => handleNavClick(item)}
                      aria-current={isActive ? "page" : undefined}
                      className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-250 group"
                      style={{
                        background: isActive
                          ? "linear-gradient(135deg, rgba(27, 20, 100, 0.08), rgba(212, 175, 55, 0.06))"
                          : "transparent",
                        color: isActive ? (isDark ? "#A5A4FF" : "#1B1464") : undefined,
                      }}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                          style={{ background: "linear-gradient(180deg, #1B1464, #D4AF37)" }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}

                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-250 ${
                          isActive ? "" : "group-hover:bg-accent"
                        }`}
                        style={isActive ? {
                          background: "linear-gradient(135deg, rgba(27, 20, 100, 0.12), rgba(212, 175, 55, 0.08))",
                        } : undefined}
                      >
                        <item.icon
                          className={`w-[18px] h-[18px] transition-colors duration-200 ${
                            isActive ? "" : "text-muted-foreground group-hover:text-foreground"
                          }`}
                          strokeWidth={isActive ? 2.5 : 1.8}
                          style={isActive ? { color: isDark ? "#A5A4FF" : "#1B1464" } : undefined}
                        />
                      </div>

                      <span className={`text-[13px] transition-colors duration-200 ${
                        isActive
                          ? "font-semibold"
                          : "text-muted-foreground group-hover:text-foreground"
                      }`}>
                        {getNavLabel(item.labelKey)}
                      </span>

                      {/* Premium badge */}
                      {item.premium && (
                        <span className="ml-auto badge-gold text-[8px] py-0.5 px-1.5">PRO</span>
                      )}

                      {/* Active gold dot */}
                      {isActive && !item.premium && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-auto w-2 h-2 rounded-full"
                          style={{ background: "linear-gradient(135deg, #D4AF37, #E8CB6A)" }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Section divider (except last) */}
              {sectionIndex < navSections.length - 1 && (
                <div className="mx-3 mt-3 divider-gold" />
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto px-3 pb-4">
        <div className="mx-3 mb-3 divider-gold" />

        {/* User card (if logged in) */}
        {user && (
          <div className="glass-card rounded-xl p-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #1B1464, #2D2580)" }}>
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* External link */}
        <a
          href="https://www.rusingacademy.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all w-full group"
        >
          <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
          <span>RusingAcademy.com</span>
        </a>

        {/* WebSocket status + Footer */}
        <div className="pt-3 mt-2 space-y-1.5">
          <div className="flex justify-center">
            <WebSocketStatus compact />
          </div>
          <p className="text-[9px] text-center leading-tight" style={{ color: isDark ? "rgba(165, 164, 255, 0.25)" : "rgba(27, 20, 100, 0.25)" }}>
            {t.footer.companyName}
          </p>
        </div>
      </div>
    </aside>
  );
}
