// DESIGN: Premium mobile navigation — glassmorphism drawer, branded accents, refined typography
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useLocale } from "@/i18n/LocaleContext";
import {
  Trophy, BookOpen, CalendarDays, Zap, PenLine, GraduationCap,
  X, MessageCircle, Mail, Shield, BarChart3,
  Crown, Gift, Sparkles, Hash, Award, DollarSign,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { PageId } from "@/components/LeftSidebar";

const RA_LOGO = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663049070748/mRLHZFARZiUVtNTg.png";

interface NavItem {
  icon: typeof MessageCircle;
  labelKey: string;
  page: PageId;
  route?: string;
  adminOnly?: boolean;
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
      { icon: Crown, labelKey: "membership", page: "membership", route: "/membership" },
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

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  activePage: PageId;
  onPageChange: (page: PageId) => void;
}

export default function MobileNav({ isOpen, onClose, activePage, onPageChange }: MobileNavProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { t } = useLocale();

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
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — frosted glass */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 lg:hidden"
            style={{
              background: "rgba(27, 20, 100, 0.15)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
            }}
          />

          {/* Drawer — premium glass */}
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed left-0 top-0 bottom-0 w-[270px] z-50 lg:hidden overflow-y-auto"
            style={{
              background: "rgba(255, 255, 255, 0.97)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "4px 0 40px rgba(27, 20, 100, 0.08)",
              borderRight: "1px solid rgba(27, 20, 100, 0.04)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between p-4"
              style={{ borderBottom: "1px solid rgba(27, 20, 100, 0.04)" }}
            >
              <div className="flex items-center gap-2.5">
                <div className="avatar-ring">
                  <img src={RA_LOGO} alt="RusingAcademy" className="w-8 h-8 rounded-lg object-contain" />
                </div>
                <div className="leading-tight">
                  <span className="text-sm font-extrabold" style={{ color: "#1B1464" }}>Rusing</span>
                  <span className="text-sm font-extrabold" style={{ color: "#D4AF37" }}>Academy</span>
                  <p className="text-[8px] text-muted-foreground font-bold tracking-[0.1em] uppercase">{t.nav.communityHub}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl transition-all duration-200"
                style={{ background: "rgba(27, 20, 100, 0.03)" }}
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <nav className="flex flex-col gap-3 p-3 mt-2">
              {navSections.map((section) => {
                const visibleItems = section.items.filter(
                  (item) => !item.adminOnly || user?.role === "admin"
                );
                if (visibleItems.length === 0) return null;

                return (
                  <div key={section.titleKey}>
                    <p className="px-3 mb-1.5 text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: "rgba(27, 20, 100, 0.3)" }}>
                      {getNavLabel(section.titleKey)}
                    </p>
                    <div className="flex flex-col gap-0.5">
                      {visibleItems.map((item) => {
                        const isActive = activePage === item.page;
                        return (
                          <button
                            key={item.page}
                            onClick={() => handleNavClick(item)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                            style={{
                              background: isActive ? "rgba(27, 20, 100, 0.05)" : "transparent",
                              color: isActive ? "#1B1464" : undefined,
                            }}
                          >
                            <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.8} style={isActive ? { color: "#1B1464" } : undefined} />
                            <span className={isActive ? "font-bold" : ""}>{getNavLabel(item.labelKey)}</span>
                            {isActive && (
                              <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "#D4AF37" }} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* External links */}
            <div className="px-3 mt-4 pt-4 space-y-0.5" style={{ borderTop: "1px solid rgba(27, 20, 100, 0.04)" }}>
              <a
                href="https://www.rusingacademy.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground transition-all w-full"
                style={{ background: "transparent" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(248, 247, 244, 0.8)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <GraduationCap className="w-5 h-5" /> RusingAcademy.com
              </a>
              <div className="pt-3 mt-3" style={{ borderTop: "1px solid rgba(27, 20, 100, 0.04)" }}>
                <p className="text-[9px] text-muted-foreground/50 text-center leading-tight">
                  {t.footer.companyName}
                </p>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
