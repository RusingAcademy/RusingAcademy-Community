import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ThreadDetail from "./pages/ThreadDetail";
import UserProfile from "./pages/UserProfile";
import Messages from "./pages/Messages";
import SearchResults from "./pages/SearchResults";
import Moderation from "./pages/Moderation";
import Analytics from "./pages/Analytics";
import { PodcastPlayerProvider } from "./components/PodcastPlayer";
import { LocaleProvider } from "./i18n/LocaleContext";
import PWAInstallBanner from "./components/PWAInstallBanner";

// Sprint 11-20 pages
import Membership from "./pages/Membership";
import Referrals from "./pages/Referrals";
import AIAssistant from "./pages/AIAssistant";
import Channels from "./pages/Channels";
import Certificates from "./pages/Certificates";
import EmailBroadcasts from "./pages/EmailBroadcasts";
import RevenueDashboard from "./pages/RevenueDashboard";
import CourseBuilder from "./pages/CourseBuilder";
import CourseCatalog from "./pages/CourseCatalog";
import CoursePlayer from "./pages/CoursePlayer";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/thread/:id"} component={ThreadDetail} />
      <Route path={"/profile/:id"} component={UserProfile} />
      <Route path={"/messages"} component={Messages} />
      <Route path={"/search"} component={SearchResults} />
      <Route path={"/moderation"} component={Moderation} />
      <Route path={"/analytics"} component={Analytics} />

      {/* Sprint 11-20 routes */}
      <Route path={"/membership"} component={Membership} />
      <Route path={"/referrals"} component={Referrals} />
      <Route path={"/ai-assistant"} component={AIAssistant} />
      <Route path={"/channels"} component={Channels} />
      <Route path={"/certificates"} component={Certificates} />
      <Route path={"/email-broadcasts"} component={EmailBroadcasts} />
      <Route path={"/revenue"} component={RevenueDashboard} />
      {/* Sprint 24-25: Course Player routes */}
      <Route path={"/courses"} component={CourseCatalog} />
      <Route path={"/courses/:id"} component={CoursePlayer} />

      {/* Admin routes */}
      <Route path={"/admin/courses"} component={CourseBuilder} />
      <Route path={"/admin/courses/new"} component={CourseBuilder} />
      <Route path={"/admin/courses/:id/edit"} component={CourseBuilder} />

      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        switchable={true}
      >
        <LocaleProvider>
          <TooltipProvider>
            <PodcastPlayerProvider>
              <Toaster />
              <Router />
              <PWAInstallBanner />
            </PodcastPlayerProvider>
          </TooltipProvider>
        </LocaleProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
