// DESIGN: Premium header — glassmorphism, branded gradient search, animated bell, gold CTAs
import { Search, Menu, LogOut, User, Plus, Sparkles, Sun, Moon } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { useState, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useLocale } from "@/i18n/LocaleContext";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import RealtimeNotificationBell from "@/components/RealtimeNotificationBell";
import WebSocketStatus from "@/components/WebSocketStatus";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const RA_LOGO = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663049070748/mRLHZFARZiUVtNTg.png";

interface TopHeaderProps {
  onMenuToggle?: () => void;
  onCreatePost?: () => void;
  onNotificationsToggle?: () => void;
}

export default function TopHeader({ onMenuToggle, onCreatePost, onNotificationsToggle }: TopHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const { t } = useLocale();
  const { theme, toggleTheme, switchable } = useTheme();
  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    },
    [searchQuery, navigate]
  );

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: theme === 'dark' ? "rgba(22, 22, 40, 0.85)" : "rgba(255, 255, 255, 0.82)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: theme === 'dark' ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid rgba(27, 20, 100, 0.06)",
        boxShadow: theme === 'dark' ? "0 1px 12px rgba(0, 0, 0, 0.15)" : "0 1px 12px rgba(15, 10, 60, 0.03)",
      }}
    >
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Mobile menu button */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2.5 rounded-xl transition-all duration-200 hover:bg-accent active:scale-95"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5">
          <div className="relative">
            <img
              src={RA_LOGO}
              alt="RusingAcademy"
              className="w-8 h-8 rounded-lg object-contain"
              style={{ boxShadow: "0 2px 8px rgba(27, 20, 100, 0.1)" }}
            />
            <div
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
              style={{ background: "linear-gradient(135deg, #D4AF37, #E8CB6A)" }}
            />
          </div>
          <span className="text-base font-extrabold tracking-tight">
            <span style={{ color: "#1B1464" }}>Rusing</span>
            <span style={{ color: "#D4AF37" }}>Academy</span>
          </span>
        </div>

        {/* Search bar — glassmorphism with focus glow */}
        <form
          onSubmit={handleSearch}
          className="hidden sm:flex items-center gap-2.5 flex-1 max-w-lg mx-4 relative"
        >
          <div
            className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-2xl transition-all duration-300"
            style={{
              background: searchFocused
                ? (theme === 'dark' ? "rgba(30, 30, 50, 0.95)" : "rgba(255, 255, 255, 0.95)")
                : (theme === 'dark' ? "rgba(30, 30, 50, 0.6)" : "rgba(248, 247, 244, 0.8)"),
              border: searchFocused
                ? "1px solid rgba(212, 175, 55, 0.3)"
                : "1px solid rgba(27, 20, 100, 0.06)",
              boxShadow: searchFocused
                ? "0 0 0 3px rgba(212, 175, 55, 0.08), 0 4px 12px rgba(15, 10, 60, 0.06)"
                : "0 1px 3px rgba(15, 10, 60, 0.02)",
            }}
          >
            <Search
              className="w-4 h-4 shrink-0 transition-colors duration-200"
              style={{ color: searchFocused ? "#1B1464" : "rgba(27, 20, 100, 0.3)" }}
            />
            <input
              type="text"
              placeholder={t.common.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground/60 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-muted-foreground hover:text-foreground text-xs font-medium px-1.5 py-0.5 rounded-md hover:bg-accent transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </form>

        {/* Right side: Language + Create + Notifications + Auth */}
        <div className="flex items-center gap-1.5">
          {/* Dark mode toggle */}
          {switchable && toggleTheme && (
            <button
              onClick={toggleTheme}
              className="relative p-2.5 rounded-xl transition-all duration-200 hover:bg-accent active:scale-95 group"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <AnimatePresence mode="wait" initial={false}>
                {theme === 'dark' ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, scale: 0, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: 90, scale: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                  >
                    <Sun className="w-5 h-5 text-amber-400" strokeWidth={1.8} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, scale: 0, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: -90, scale: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                  >
                    <Moon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.8} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          )}

          <LanguageSwitcher variant="compact" />

          {isAuthenticated && user ? (
            <>
              {/* Create Post Button — gradient gold */}
              <Button
                onClick={onCreatePost}
                className="rounded-xl px-4 font-semibold text-sm hidden sm:flex items-center gap-1.5 border-0 transition-all duration-300 hover:shadow-lg active:scale-[0.97]"
                style={{
                  background: "linear-gradient(135deg, #D4AF37, #E8CB6A)",
                  color: "#1B1464",
                  boxShadow: "0 2px 8px rgba(212, 175, 55, 0.2)",
                }}
                size="sm"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                {t.common.create}
              </Button>
              <button
                onClick={onCreatePost}
                className="sm:hidden p-2.5 rounded-xl transition-all duration-200 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(232, 203, 106, 0.05))",
                }}
              >
                <Plus className="w-5 h-5" style={{ color: "#D4AF37" }} strokeWidth={2.5} />
              </button>

              {/* Notifications bell — real-time WebSocket + tRPC */}
              <RealtimeNotificationBell onClick={onNotificationsToggle} />

              {/* User dropdown — avatar with gradient ring */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-xl hover:bg-accent transition-all duration-200 p-1 pr-3 active:scale-[0.97]">
                    <div className="avatar-ring">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name ?? ""}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-bold"
                          style={{ background: "linear-gradient(135deg, #1B1464, #2D2580)" }}
                        >
                          {(user.name ?? "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="hidden sm:inline text-sm font-semibold text-foreground truncate max-w-[120px]">
                      {user.name ?? "User"}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-52 rounded-xl p-1.5"
                  style={{
                    background: theme === 'dark' ? "rgba(30, 30, 50, 0.95)" : "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(16px)",
                    border: theme === 'dark' ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(27, 20, 100, 0.06)",
                    boxShadow: theme === 'dark' ? "0 8px 32px rgba(0, 0, 0, 0.3)" : "0 8px 32px rgba(15, 10, 60, 0.08), 0 2px 8px rgba(15, 10, 60, 0.04)",
                  }}
                >
                  <DropdownMenuItem
                    onClick={() => navigate(`/profile/${user.id}`)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium cursor-pointer"
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{t.common.profile}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1 bg-border/50" />
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t.common.logout}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => { window.location.href = getLoginUrl(); }}
                className="rounded-xl px-5 font-semibold text-sm text-white border-0 transition-all duration-300 hover:shadow-lg active:scale-[0.97]"
                style={{
                  background: "linear-gradient(135deg, #1B1464, #2D2580)",
                  boxShadow: "0 2px 8px rgba(27, 20, 100, 0.15)",
                }}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                {t.common.signUpLogIn}
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
