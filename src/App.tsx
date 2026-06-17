import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { lazy, Suspense, useEffect, useState } from 'react';
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

import ImagePreloader from "./components/ImagePreloader";
import SplashScreen from "./components/ui/SplashScreen";

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
const Season1 = lazy(() => import("./pages/seasons/Season1"));
const Season2 = lazy(() => import("./pages/seasons/Season2"));
const Season3 = lazy(() => import("./pages/seasons/Season3"));
const Season4 = lazy(() => import("./pages/seasons/Season4"));
const Season5 = lazy(() => import("./pages/seasons/Season5"));
const Season6 = lazy(() => import("./pages/seasons/Season6"));
const SeasonCAMU = lazy(() => import("./pages/seasons/SeasonCAMU"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ResetPasswordChange = lazy(() => import("./pages/ResetPasswordChange"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const RegistrationSelection = lazy(() => import("./pages/RegistrationSelection"));
const ChairApplication = lazy(() => import("./pages/ChairApplication"));
const VolunteerApplication = lazy(() => import("./pages/VolunteerApplication"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MunCommand = lazy(() => import("./pages/MunCommand"));
const Awards = lazy(() => import("./pages/Awards"));

// Admin pages — only ever loaded for the admin subdomain
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminCommittees = lazy(() => import("./pages/admin/AdminCommittees"));
const AdminSchedule = lazy(() => import("./pages/admin/AdminSchedule"));
const AdminResources = lazy(() => import("./pages/admin/AdminResources"));
const AdminApplications = lazy(() => import("./pages/admin/AdminApplications"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages"));
const DelegateManagement = lazy(() => import("./pages/admin/DelegateManagement"));
const CountryMatrix = lazy(() => import("./pages/admin/CountryMatrix"));
const CommitteeAllocation = lazy(() => import("./pages/admin/CommitteeAllocation"));
const ChairManagement = lazy(() => import("./pages/admin/ChairManagement"));
const AdminVolunteers = lazy(() => import("./pages/admin/AdminVolunteers"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminAwards = lazy(() => import("./pages/admin/AdminAwards"));
const AdminHomepage = lazy(() => import("./pages/admin/Homepage"));
const CheckIn = lazy(() => import("./pages/admin/CheckIn"));
const FormSettings = lazy(() => import("./pages/admin/FormSettings"));

// Delegate dashboard
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Overview = lazy(() => import("./pages/dashboard/Overview"));
const MyApplication = lazy(() => import("./pages/dashboard/MyApplication"));
const MyCommittee = lazy(() => import("./pages/dashboard/MyCommittee"));
const DashboardMessages = lazy(() => import("./pages/dashboard/Messages"));
const DashboardSettings = lazy(() => import("./pages/dashboard/Settings"));
const LiveSession = lazy(() => import("./pages/dashboard/LiveSession"));

// Chair dashboard
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

// Lightweight fallback while a route chunk is being fetched.
const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="w-8 h-8 border-4 border-diplomatic-500 border-t-transparent rounded-full animate-spin" />
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

const App = () => {
  const { isOpen, closeMessage } = useSecretMessage();
  const [showSplash, setShowSplash] = useState(true);
  const subdomain = useSubdomain();

  const renderRoutes = () => {
    if (subdomain === 'admin') {
      return (
        <Routes>
          <Route path="/" element={<AdminLogin />} />
          <Route path="/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/committees" element={<AdminRoute allow={['sg','academics']}><AdminCommittees /></AdminRoute>} />
          <Route path="/schedule" element={<AdminRoute allow={['sg','academics']}><AdminSchedule /></AdminRoute>} />
          <Route path="/resources" element={<AdminRoute allow={['sg','academics']}><AdminResources /></AdminRoute>} />
          <Route path="/applications" element={<AdminRoute allow={['sg','academics']}><AdminApplications /></AdminRoute>} />
          <Route path="/messages" element={<AdminRoute allow={['sg']}><AdminMessages /></AdminRoute>} />
          <Route path="/delegates" element={<AdminRoute allow={['sg','academics']}><DelegateManagement /></AdminRoute>} />
          <Route path="/allocation" element={<AdminRoute allow={['sg','academics']}><CommitteeAllocation /></AdminRoute>} />
          <Route path="/country-matrix" element={<AdminRoute allow={['sg','academics']}><CountryMatrix /></AdminRoute>} />
          <Route path="/chairs" element={<AdminRoute allow={['sg','academics']}><ChairManagement /></AdminRoute>} />
          <Route path="/volunteers" element={<AdminRoute allow={['sg','logistics']}><AdminVolunteers /></AdminRoute>} />
          <Route path="/analytics" element={<AdminRoute allow={['sg','academics']}><AdminAnalytics /></AdminRoute>} />
          <Route path="/awards" element={<AdminRoute allow={['sg','academics']}><AdminAwards /></AdminRoute>} />
          <Route path="/homepage" element={<AdminRoute allow={['sg']}><AdminHomepage /></AdminRoute>} />
          <Route path="/check-in" element={<CheckInRoute><CheckIn /></CheckInRoute>} />
          <Route path="/forms" element={<AdminRoute allow={['sg']}><FormSettings /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      );
    }

    if (subdomain === 'chair') {
      return (
        <Routes>
          <Route path="/" element={<ChairLogin />} />
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
        <Route path="/seasons/1" element={<Season1 />} />
        <Route path="/seasons/2" element={<Season2 />} />
        <Route path="/seasons/3" element={<Season3 />} />
        <Route path="/seasons/4" element={<Season4 />} />
        <Route path="/seasons/5" element={<Season5 />} />
        <Route path="/seasons/Season5" element={<Navigate to="/seasons/5" replace />} />
        <Route path="/seasons/6" element={<Season6 />} />
        <Route path="/seasons/camu" element={<SeasonCAMU />} />
        <Route path="/mun-command" element={<MunCommand />} />

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
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
          <BrowserRouter>
            <ScrollToTop />
            <ImagePreloader />

            {/* Secret Message Easter Egg */}
            <SecretMessage isOpen={isOpen} onClose={closeMessage} />

            <Suspense fallback={<RouteFallback />}>
              {renderRoutes()}
            </Suspense>

            <Analytics />
            <SpeedInsights />
          </BrowserRouter>
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

export default App;
