import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import ChairApplicantDashboard from './ChairApplicantDashboard';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [appType, setAppType] = useState<'delegate' | 'chair' | null>(null);
  const [appChecking, setAppChecking] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [loading, user, navigate]);

  // Detect whether this user applied as delegate or chair so we can branch.
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from('applications')
        .select('application_type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      const t = (data as any)?.application_type;
      setAppType(t === 'chair' ? 'chair' : 'delegate');
      setAppChecking(false);
    })();
  }, [user?.id]);

  if (loading || !user || appChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-diplomatic-950">
        <div className="text-white/70 text-sm">Loading your dashboard...</div>
      </div>
    );
  }

  // Chair applicant → dedicated status screen, not the delegate dashboard
  if (appType === 'chair') {
    return <ChairApplicantDashboard userEmail={user.email || ''} />;
  }

  const dashboardUser = {
    id: user.id,
    name: (user.user_metadata as any)?.full_name || user.email || 'Delegate',
    email: user.email || '',
    role: 'delegate',
    avatar_url: (user.user_metadata as any)?.avatar_url || null,
  };

  return (
    <div className="flex h-[100dvh] bg-diplomatic-950">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} user={dashboardUser} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />
      )}
    </div>
  );
}
