import { Toaster } from "@/components/ui/toaster";
import { MotionConfig } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { SecretMessage, useSecretMessage } from "@/components/easter-egg/SecretMessage";
import { useSubdomain } from "./hooks/use-subdomain";

// Import animations
import '@/styles/animations.css';
import '@/styles/mobile.css';

// Route guards stay eager — they're tiny and run before any page renders.
import AdminRoute from "./components/admin/AdminRoute";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import CheckInRoute from "./components/admin/CheckInRoute";
import ChairRoute from "./components/chair/ChairRoute";

import SplashScreen from "./components/ui/SplashScreen";
import ErrorBoundary from "./components/ErrorBoundary";

// ── Lazy-loaded pages ────────────────────────────────────────────────
// Splits each page into its own chunk so the marketing-site visitor
// doesn't download admin or dashboard code, and vice versa.
const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const Committees = lazy(() => import("./pages/Committees"));
const Registration = lazy(() => import("./pages/Registration"));
const Schedule = lazy(() => import("./pages/Schedule"));
const ResourcesPage = lazy(() => import("./pages/Resources"));
const Contact = lazy(() => import("./pages/Contact"));
const PastConferences = lazy(() => import("./pages/PastConferences"));
const EventUpdates = lazy(() => import("./pages/EventUpdates"));
const SeasonRoute = lazy(() => import("./pages/seasons/SeasonRoute"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ResetPasswordChange = lazy(() => import("./pages/ResetPasswordChange"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const RegistrationSelection = lazy(() => import("./pages/RegistrationSelection"));
const ChairApplication = lazy(() => import("./pages/ChairApplication"));
const VolunteerApplication = lazy(() => import("./pages/VolunteerApplication"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Awards = lazy(() => import("./pages/Awards"));
const Team = lazy(() => import("./pages/Team"));

// Admin pages — only ever loaded for the admin subdomain
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminCommittees = lazy(() => import("./pages/admin/AdminCommittees"));
const AdminSchedule = lazy(() => import("./pages/admin/AdminSchedule"));
const AdminResources = lazy(() => import("./pages/admin/AdminResources"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages"));
const Delegates = lazy(() => import("./pages/admin/Delegates"));
const DebateDay = lazy(() => import("./pages/admin/DebateDay"));
const Judging = lazy(() => import("./pages/admin/Judging"));
const Allocation = lazy(() => import("./pages/admin/Allocation"));
const ChairManagement = lazy(() => import("./pages/admin/ChairManagement"));
const AdminVolunteers = lazy(() => import("./pages/admin/AdminVolunteers"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminAwards = lazy(() => import("./pages/admin/AdminAwards"));
const SiteContent = lazy(() => import("./pages/admin/SiteContent"));
const AdminTeam = lazy(() => import("./pages/admin/AdminTeam"));
const DebateRegistrations = lazy(() => import("./pages/admin/DebateRegistrations"));
const CheckIn = lazy(() => import("./pages/admin/CheckIn"));
const FormSettings = lazy(() => import("./pages/admin/FormSettings"));
const AdminAccounts = lazy(() => import("./pages/admin/AdminAccounts"));
const Seasons = lazy(() => import("./pages/admin/Seasons"));
const ActivityLog = lazy(() => import("./pages/admin/ActivityLog"));

// Delegate dashboard
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Overview = lazy(() => import("./pages/dashboard/Overview"));
const MyApplication = lazy(() => import("./pages/dashboard/MyApplication"));
const MyCommittee = lazy(() => import("./pages/dashboard/MyCommittee"));
const DashboardMessages = lazy(() => import("./pages/dashboard/Messages"));
const DashboardSettings = lazy(() => import("./pages/dashboard/Settings"));
const LiveSession = lazy(() => import("./pages/dashboard/LiveSession"));

// Chair dashboard
// Turon Debate (debat.turonmun.com)
const DebateLanding = lazy(() => import("./pages/debate/DebateLanding"));
const DebateLogin = lazy(() => import("./pages/debate/DebateLogin"));
const DebateRegister = lazy(() => import("./pages/debate/DebateRegister"));

const ChairLogin = lazy(() => import("./pages/chair/ChairLogin"));
const ChairDashboardLayout = lazy(() => import("./pages/dashboard/ChairDashboard"));
const ChairOverview = lazy(() => import("./pages/dashboard/chair/Overview"));
const ChairAnnouncements = lazy(() => import("./pages/dashboard/chair/Announcements"));
const ChairPositionPapers = lazy(() => import("./pages/dashboard/chair/PositionPapers"));
const ChairAwards = lazy(() => import("./pages/dashboard/chair/Awards"));
const ChairSchedule = lazy(() => import("./pages/dashboard/chair/Schedule"));
const ChairDelegates = lazy(() => import("./pages/dashboard/chair/Delegates"));
const CommandCenter = lazy(() => import("./pages/dashboard/chair/CommandCenter"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 10 * 60 * 1000, // 10 minutes - data stays fresh longer
      gcTime: 15 * 60 * 1000, // 15 minutes - garbage collection time
      refetchOnMount: false, // Don't refetch on component mount if data is fresh
    },
  },
});

// Lightweight fallback while a route chunk is being fetched. Navy on the
// public site so pages don't flash white; the admin, chair and Turon Debate
// pages are light.
const RouteFallback = () => {
  const subdomain = useSubdomain();
  const dark = subdomain === 'none' && !window.location.pathname.startsWith('/debat');
  return (
    <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-diplomatic-900' : 'bg-white'}`}>
      <div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin ${dark ? 'border-gold-400' : 'border-diplomatic-500'}`} />
    </div>
  );
};

// Shown instead of a blank page when something crashes. A reload fetches fresh
// files, which fixes the usual cause (a stale copy after a deploy).
const CrashScreen = () => (
  <div className="min-h-screen flex items-center justify-center px-4">
    <div className="max-w-sm w-full rounded-2xl bg-white p-8 text-center shadow-xl">
      <h1 className="text-xl font-semibold text-diplomatic-900 mb-2">This page didn't load properly</h1>
      <p className="text-sm text-neutral-600 mb-6">Reloading usually fixes it.</p>
      <button
        onClick={() => window.location.reload()}
        className="w-full rounded-lg bg-diplomatic-700 px-4 py-2.5 font-semibold text-white hover:bg-diplomatic-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
      >
        Reload page
      </button>
    </div>
  </div>
);

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  const { openMessage } = useSecretMessage();

  // Add keyboard event listener for question mark key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && (e.ctrlKey || e.metaKey)) {
        openMessage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openMessage]);

  useEffect(() => {
    // Scroll to top when pathname changes
    window.scrollTo(0, 0);

    // GA page-view tracking (gtag injected by Vercel Analytics or external script)
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', { page_path: pathname });
    }
  }, [pathname]);

  return null;
};

// Old admin address → new one, keeping the query (?stage=…, ?subdomain=…).
const KeepQueryRedirect = ({ to }: { to: string }) => {
  const { search } = useLocation();
  return <Navigate to={`${to}${search}`} replace />;
};

const App = () => {
  const { isOpen, closeMessage } = useSecretMessage();
  // Splash greets a visitor once per browser session, not on every reload or link.
  const [showSplash, setShowSplash] = useState(() => {
    try { return !sessionStorage.getItem('turonmun:splash'); } catch { return true; }
  });
  const endSplash = useCallback(() => {
    setShowSplash(false);
    try { sessionStorage.setItem('turonmun:splash', '1'); } catch { /* private mode */ }
  }, []);
  const subdomain = useSubdomain();

  const renderRoutes = () => {
    if (subdomain === 'admin') {
      return (
        <Routes>
          <Route path="/" element={<AdminLogin />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/committees" element={<AdminRoute allow={['sg','academics']}><AdminCommittees /></AdminRoute>} />
          <Route path="/schedule" element={<AdminRoute allow={['sg','academics']}><AdminSchedule /></AdminRoute>} />
          <Route path="/resources" element={<AdminRoute allow={['sg','academics']}><AdminResources /></AdminRoute>} />
          <Route path="/applications" element={<KeepQueryRedirect to="/delegates" />} />
          <Route path="/messages" element={<AdminRoute allow={['sg']}><AdminMessages /></AdminRoute>} />
          <Route path="/delegates" element={<AdminRoute allow={['sg','academics']}><Delegates /></AdminRoute>} />
          <Route path="/allocation" element={<AdminRoute allow={['sg','academics']}><Allocation /></AdminRoute>} />
          <Route path="/country-matrix" element={<Navigate to="/allocation?view=matrix" replace />} />
          <Route path="/chairs" element={<AdminRoute allow={['sg','academics']}><ChairManagement /></AdminRoute>} />
          <Route path="/volunteers" element={<AdminRoute allow={['sg','logistics']}><AdminVolunteers /></AdminRoute>} />
          <Route path="/debate" element={<AdminRoute allow={['sg','academics']}><DebateRegistrations /></AdminRoute>} />
          <Route path="/debate-day" element={<AdminRoute allow={['sg','academics']}><DebateDay /></AdminRoute>} />
          <Route path="/judging" element={<AdminRoute allow={['sg','academics','judge']}><Judging /></AdminRoute>} />
          <Route path="/analytics" element={<AdminRoute allow={['sg','academics']}><AdminAnalytics /></AdminRoute>} />
          <Route path="/awards" element={<AdminRoute allow={['sg','academics']}><AdminAwards /></AdminRoute>} />
          <Route path="/content" element={<AdminRoute allow={['sg']}><SiteContent /></AdminRoute>} />
          <Route path="/homepage" element={<Navigate to="/content" replace />} />
          <Route path="/team" element={<AdminRoute allow={['sg']}><AdminTeam /></AdminRoute>} />
          <Route path="/check-in" element={<CheckInRoute><CheckIn /></CheckInRoute>} />
          <Route path="/reset-password-change" element={<ResetPasswordChange />} />
          <Route path="/forms" element={<AdminRoute allow={['sg']}><FormSettings /></AdminRoute>} />
          <Route path="/accounts" element={<AdminRoute allow={['sg']}><AdminAccounts /></AdminRoute>} />
          <Route path="/seasons" element={<AdminRoute allow={['sg']}><Seasons /></AdminRoute>} />
          <Route path="/activity" element={<AdminRoute allow={['sg']}><ActivityLog /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      );
    }

    if (subdomain === 'debate') {
      return (
        <Routes>
          <Route path="/" element={<DebateLanding />} />
          <Route path="/login" element={<DebateLogin />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/register" element={<DebateRegister />} />
          <Route path="/reset-password-change" element={<ResetPasswordChange />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      );
    }

    if (subdomain === 'chair') {
      return (
        <Routes>
          <Route path="/" element={<ChairLogin />} />
          {/* OAuth return lands here; AuthCallback honours ?next=/dashboard.
              Without this route the chair subdomain's catch-all bounced the
              Google sign-in back to the login page. */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/reset-password-change" element={<ResetPasswordChange />} />
          <Route element={<ChairRoute><ChairDashboardLayout /></ChairRoute>}>
            <Route path="/dashboard" element={<ChairOverview />} />
            <Route path="/announcements" element={<ChairAnnouncements />} />
            <Route path="/papers" element={<ChairPositionPapers />} />
            <Route path="/awards" element={<ChairAwards />} />
            <Route path="/schedule" element={<ChairSchedule />} />
            <Route path="/delegates" element={<ChairDelegates />} />
            <Route path="/command" element={<CommandCenter />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      );
    }

    return (
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/about" element={<About />} />
        <Route path="/event-updates" element={<EventUpdates />} />
        <Route path="/committees" element={<Committees />} />
        <Route path="/register" element={<RegistrationSelection />} />
        <Route path="/register/delegate" element={<ProtectedRoute><Registration /></ProtectedRoute>} />
        <Route path="/register/chair" element={<ProtectedRoute><ChairApplication /></ProtectedRoute>} />
        <Route path="/register/volunteer" element={<ProtectedRoute><VolunteerApplication /></ProtectedRoute>} />
        <Route path="/registration" element={<Navigate to="/register" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password-change" element={<ResetPasswordChange />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/past-conferences" element={<PastConferences />} />
        <Route path="/awards" element={<Awards />} />
        <Route path="/team" element={<Team />} />
        <Route path="/seasons/Season5" element={<Navigate to="/seasons/5" replace />} />
        {/* Every past season (built-in and admin-added) — see Site content → Seasons */}
        <Route path="/seasons/:slug" element={<SeasonRoute />} />

        {/* Turon Debate at turonmun.com/debat (same pages as debat.turonmun.com) */}
        <Route path="/debat" element={<DebateLanding />} />
        <Route path="/debat/login" element={<DebateLogin />} />
        <Route path="/debat/register" element={<DebateRegister />} />

        {/* Chair login & dashboard (non-subdomain access) */}
        <Route path="/chair-login" element={<ChairLogin />} />
        <Route path="/chair-dashboard" element={<ChairRoute><ChairDashboardLayout /></ChairRoute>}>
          <Route index element={<ChairOverview />} />
          <Route path="command" element={<CommandCenter />} />
          <Route path="announcements" element={<ChairAnnouncements />} />
          <Route path="papers" element={<ChairPositionPapers />} />
          <Route path="awards" element={<ChairAwards />} />
          <Route path="schedule" element={<ChairSchedule />} />
          <Route path="delegates" element={<ChairDelegates />} />
        </Route>

        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<Overview />} />
          <Route path="application" element={<MyApplication />} />
          <Route path="committee" element={<MyCommittee />} />
          <Route path="live" element={<LiveSession />} />
          <Route path="messages" element={<DashboardMessages />} />
          <Route path="settings" element={<DashboardSettings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  };

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <MotionConfig reducedMotion="user">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {showSplash && subdomain === 'none' && !window.location.pathname.startsWith('/debat') && <SplashScreen onComplete={endSplash} />}
          <BrowserRouter>
            <ScrollToTop />

            {/* Secret Message Easter Egg */}
            <SecretMessage isOpen={isOpen} onClose={closeMessage} />

            {/* Without this, any crash (e.g. a page file that won't load) leaves a blank page. */}
            <ErrorBoundary fallback={<CrashScreen />}>
              <Suspense fallback={<RouteFallback />}>
                {renderRoutes()}
              </Suspense>
            </ErrorBoundary>

            <Analytics />
            <SpeedInsights />
          </BrowserRouter>
        </TooltipProvider>
        </MotionConfig>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

export default App;
