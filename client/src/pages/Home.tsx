// ============================================================
// DESIGN: RusingAcademy Community Hub
// Layout: Left sidebar + Top header + Center feed + Right sidebar
// Color: Navy #1B1464, Gold #D4AF37, Warm white base
// Font: Plus Jakarta Sans 400/600/800
// ENRICHED: Gamification, Classroom, Events, Challenges, Notebook
// ============================================================

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, Search, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { useLocale } from "@/i18n/LocaleContext";
import LeftSidebar, { type PageId } from "@/components/LeftSidebar";
import TopHeader from "@/components/TopHeader";
import TopicCarousel from "@/components/TopicCarousel";
import PostCard from "@/components/PostCard";
import RightSidebar from "@/components/RightSidebar";
import DailyPractice from "@/components/DailyPractice";
import MobileNav from "@/components/MobileNav";
import Leaderboard from "@/components/Leaderboard";
import Classroom from "@/components/Classroom";
import EventsCalendar from "@/components/EventsCalendar";
import Challenges from "@/components/Challenges";
import Notebook from "@/components/Notebook";
import { useFeed, useCreateThread } from "@/hooks/useCommunityData";
import CreatePostDialog from "@/components/CreatePostDialog";
import NotificationsPanel from "@/components/NotificationsPanel";


type TabId = "for-you" | "podcasts" | "exercises" | "questions";

const tabToContentType: Record<TabId, "article" | "podcast" | "exercise" | "question" | undefined> = {
  "for-you": undefined,
  podcasts: "podcast",
  exercises: "exercise",
  questions: "question",
};

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLocale();

  const [activePage, setActivePage] = useState<PageId>("community");
  const [activeTab, setActiveTab] = useState<TabId>("for-you");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const tabs: { id: TabId; label: string }[] = [
    { id: "for-you", label: t.feed.forYou },
    { id: "podcasts", label: t.feed.podcasts },
    { id: "exercises", label: t.feed.exercises },
    { id: "questions", label: t.feed.questions },
  ];

  // tRPC-backed feed with fallback to mock data
  const { posts: currentPosts, isLoading: feedLoading } = useFeed(tabToContentType[activeTab]);
  const createThread = useCreateThread();

  const getTabCTA = () => {
    const handleCreate = () => {
      if (!isAuthenticated) {
        window.location.href = getLoginUrl();
        return;
      }
      setCreatePostOpen(true);
    };

    switch (activeTab) {
      case "for-you":
        return { label: t.feed.createPost, action: handleCreate };
      case "podcasts":
        return { label: t.feed.createPost, action: handleCreate };
      case "exercises":
        return { label: t.feed.practiceNow, action: () => toast(t.common.comingSoon) };
      case "questions":
        return { label: t.feed.ask, action: handleCreate };
    }
  };

  const cta = getTabCTA();

  const showRightSidebar = activePage === "community";
  const isWideContent = activePage !== "community";

  const renderPageContent = () => {
    switch (activePage) {
      case "leaderboard":
        return <Leaderboard />;
      case "classroom":
        return <Classroom />;
      case "events":
        return <EventsCalendar />;
      case "challenges":
        return <Challenges />;
      case "notebook":
        return <Notebook />;
      case "community":
      default:
        return (
          <>
            {/* Tabs */}
            <div className="flex items-center gap-1 mb-5 pb-0" style={{ borderBottom: "1px solid rgba(27, 20, 100, 0.06)" }}>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-4 py-3 text-sm font-bold tracking-tight transition-colors ${
                      isActive
                        ? "text-[#1B1464]"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                    {isActive && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                        style={{ background: "linear-gradient(90deg, #1B1464, #D4AF37)" }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Filters row */}
            <div className="flex items-center gap-2.5 mb-5">
              <Button
                onClick={cta.action}
                className="rounded-xl font-bold text-sm px-5 text-white border-0"
                style={{ background: "linear-gradient(135deg, #1B1464, #2D2580)", boxShadow: "0 2px 8px rgba(27, 20, 100, 0.15)" }}
              >
                {cta.label} <ChevronDown className="w-3.5 h-3.5 ml-1" />
              </Button>
              <button
                onClick={() => toast(t.common.comingSoon)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground"
                style={{ border: "1px solid rgba(27, 20, 100, 0.08)", background: "rgba(27, 20, 100, 0.02)" }}
              >
                <Filter className="w-3.5 h-3.5" />
                {t.feed.languageFilter}
              </button>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 max-w-[200px] transition-all duration-200 focus-within:ring-2 focus-within:ring-[#D4AF37]/30" style={{ border: "1px solid rgba(27, 20, 100, 0.08)", background: "rgba(27, 20, 100, 0.02)" }}>
                <Search className="w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t.feed.searchByKeyword}
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Topic Carousel (For You tab) */}
            {activeTab === "for-you" && <TopicCarousel />}

            {/* Daily Practice (Exercise tab) */}
            {activeTab === "exercises" && <DailyPractice />}

            {/* Loading state */}
            {feedLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" />
              </div>
            )}

            {/* Posts Feed */}
            {!feedLoading && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-4"
                >
                  {currentPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </motion.div>
              </AnimatePresence>
            )}

            {/* Show More */}
            <div className="flex justify-center py-8">
              <button
                onClick={() => toast(t.common.comingSoon)}
                className="flex items-center gap-2 text-sm font-semibold transition-all duration-200 px-5 py-2.5 rounded-xl hover:scale-[1.02]"
                style={{ color: "#1B1464", background: "rgba(27, 20, 100, 0.04)", border: "1px solid rgba(27, 20, 100, 0.08)" }}
              >
                {t.common.showMore} <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Skip to main content (accessibility) */}
      <a href="#main-content" className="skip-to-main">{t.common.skipToMain}</a>
      {/* Mobile Nav Drawer */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        activePage={activePage}
        onPageChange={setActivePage}
      />

      {/* Left Sidebar - Desktop */}
      <LeftSidebar activePage={activePage} onPageChange={setActivePage} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <TopHeader
          onMenuToggle={() => setMobileNavOpen(true)}
          onCreatePost={() => setCreatePostOpen(true)}
          onNotificationsToggle={() => setNotificationsOpen(true)}
        />

        {/* Content with optional Right Sidebar */}
        <div className="flex flex-1">
          {/* Center Feed / Page Content */}
          <main
            id="main-content"
            role="main"
            aria-label="Community content"
            className={`flex-1 min-w-0 mx-auto px-4 lg:px-6 py-5 ${isWideContent ? "max-w-[900px]" : "max-w-[680px]"}`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {renderPageContent()}
              </motion.div>
            </AnimatePresence>

            {/* Footer */}
            <footer className="pt-8 pb-12 mt-8" style={{ borderTop: "1px solid rgba(27, 20, 100, 0.06)" }}>
              <div className="text-center mb-6">
                <a
                  href="https://www.rusingacademy.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    className="rounded-xl px-8 py-3 font-bold text-base text-white border-0"
                    style={{ background: "linear-gradient(135deg, #1B1464, #2D2580)", boxShadow: "0 4px 16px rgba(27, 20, 100, 0.2)" }}
                  >
                    {t.footer.startLearning}
                  </Button>
                </a>
              </div>

              <h3 className="text-lg font-bold text-foreground text-center mb-6">
                {t.footer.ourEcosystem}
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4 text-sm">
                <div>
                  <h4 className="font-bold text-foreground mb-2" style={{ color: "#1B1464" }}>RusingAcademy</h4>
                  <p className="text-muted-foreground py-0.5">{t.footer.professionalCourses}</p>
                  <p className="text-muted-foreground py-0.5">{t.footer.publicServiceExamPrep}</p>
                  <p className="text-muted-foreground py-0.5">{t.footer.bilingualExcellence}</p>
                  <p className="text-muted-foreground py-0.5">{t.footer.expertCoaching}</p>
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-2" style={{ color: "#D4AF37" }}>Lingueefy</h4>
                  <p className="text-muted-foreground py-0.5">{t.footer.humanAiCoaching}</p>
                  <p className="text-muted-foreground py-0.5">{t.footer.certifiedInstructors}</p>
                  <p className="text-muted-foreground py-0.5">{t.footer.personalizedPrograms}</p>
                  <p className="text-muted-foreground py-0.5">{t.footer.flexibleScheduling}</p>
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-2">Barholex Media</h4>
                  <p className="text-muted-foreground py-0.5">{t.footer.edtechConsulting}</p>
                  <p className="text-muted-foreground py-0.5">{t.footer.podcastsVideos}</p>
                  <p className="text-muted-foreground py-0.5">{t.footer.digitalCourses}</p>
                  <p className="text-muted-foreground py-0.5">{t.footer.aiPoweredTools}</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 mt-8 pt-6" style={{ borderTop: "1px solid rgba(27, 20, 100, 0.06)" }}>
                <p className="text-xs font-semibold text-foreground">
                  {t.footer.companyName}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {t.footer.tagline}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>English / Fran&ccedil;ais</span>
                  <span>&middot;</span>
                  <span>CAD $</span>
                </div>
              </div>
            </footer>
          </main>

          {/* Right Sidebar - Desktop (only on community feed) */}
          {showRightSidebar && <RightSidebar />}
        </div>
      </div>
      {/* Create Post Dialog */}
      <CreatePostDialog
        isOpen={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        defaultType={activeTab === "questions" ? "question" : activeTab === "podcasts" ? "podcast" : activeTab === "exercises" ? "exercise" : "article"}
      />

      {/* Notifications Panel */}
      <NotificationsPanel
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />


    </div>
  );
}
