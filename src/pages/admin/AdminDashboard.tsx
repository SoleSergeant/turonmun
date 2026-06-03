
import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase, checkSupabaseConnection } from '@/integrations/supabase/client';
import {
  Users,
  Calendar,
  Mail,
  AlertCircle,
  ChevronRight,
  UserCheck,
  Globe,
  BarChart3,
  MapPin,
  Shield,
  Loader2,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useCommittees } from '@/hooks/useCommittees';

interface DashboardCounts {
  schedule_days: number;
  applications: number;
  unread_messages: number;
  resources: number;
}

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean, message: string } | null>(null);
  const { toast } = useToast();
  const { committees } = useCommittees();
  const [counts, setCounts] = useState<DashboardCounts>({
    schedule_days: 0,
    applications: 0,
    unread_messages: 0,
    resources: 0,
  });
  const [applicationsByStatus, setApplicationsByStatus] = useState<Record<string, number>>({});
  const [delegateStats, setDelegateStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const [chairStats, setChairStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);

  useEffect(() => {
    const checkConnection = async () => {
      const status = await checkSupabaseConnection();
      setConnectionStatus(status);
      if (!status.success) {
        toast({ title: "Database Connection Error", description: status.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      fetchDashboardData();
    };
    checkConnection();
  }, [toast]);

  const fetchDashboardData = async () => {
    try {
      const [
        scheduleRes, applicationsRes, unreadRes, resourcesRes,
        recentAppsRes, recentMsgsRes, statusStatsRes
      ] = await Promise.all([
        supabase.from('schedule_events').select('id', { count: 'exact', head: true }),
        supabase.from('applications').select('id', { count: 'exact', head: true }),
        supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('is_read', false),
        supabase.from('resources').select('id', { count: 'exact', head: true }),
        supabase.from('applications').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('applications').select('status, notes, application_type').not('status', 'is', null),
      ]);

      setCounts({
        schedule_days: scheduleRes.count || 0,
        applications: applicationsRes.count || 0,
        unread_messages: unreadRes.count || 0,
        resources: resourcesRes.count || 0,
      });

      setRecentApplications(recentAppsRes.data || []);
      setRecentMessages(recentMsgsRes.data || []);

      if (statusStatsRes.data) {
        const allApps = statusStatsRes.data as any[];

        // Split by type: notes marker is ground truth, application_type column is secondary
        const isChairApp = (a: any) =>
          a.notes?.includes('APPLICATION TYPE: chair') || a.application_type === 'chair';

        const getTypeCounts = (apps: any[]) => {
          const c = { total: 0, approved: 0, pending: 0, rejected: 0 };
          apps.forEach(a => {
            c.total += 1;
            const s = a.status || 'pending';
            if (s === 'approved') c.approved += 1;
            else if (s === 'rejected') c.rejected += 1;
            else c.pending += 1;
          });
          return c;
        };

        setDelegateStats(getTypeCounts(allApps.filter(a => !isChairApp(a))));
        setChairStats(getTypeCounts(allApps.filter(isChairApp)));

        const statusCounts: Record<string, number> = {};
        allApps.forEach(app => {
          const status = app.status || 'unknown';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        setApplicationsByStatus(statusCounts);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({ title: "Error Loading Dashboard", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const totalApps = Object.values(applicationsByStatus).reduce((a, b) => a + b, 0);
  const approved = applicationsByStatus['approved'] || 0;
  const pending = applicationsByStatus['pending'] || 0;
  const rejected = applicationsByStatus['rejected'] || 0;

  const isAdminSubdomain = window.location.hostname.startsWith('admin.');
  const s = isAdminSubdomain ? '' : '?subdomain=admin';

  const navCards = [
    {
      title: 'Delegate Management',
      description: 'View, filter, and manage all delegate applications and assignments',
      icon: Users,
      path: `/delegates${s}`,
      gradient: 'from-blue-500 to-blue-600',
      badge: counts.applications > 0 ? `${counts.applications} total` : null,
    },
    {
      title: 'Committee Management',
      description: 'Create committees, assign chairs, upload background guides',
      icon: Globe,
      path: `/committees${s}`,
      gradient: 'from-indigo-500 to-indigo-600',
      badge: committees.length > 0 ? `${committees.length} active` : null,
    },
    {
      title: 'Country Matrix',
      description: 'Manage country-committee assignments and availability',
      icon: MapPin,
      path: `/country-matrix${s}`,
      gradient: 'from-teal-500 to-teal-600',
      badge: null,
    },
    {
      title: 'Applications',
      description: 'Review, approve, reject and manage incoming applications',
      icon: UserCheck,
      path: `/applications${s}`,
      gradient: 'from-purple-500 to-purple-600',
      badge: pending > 0 ? `${pending} pending` : null,
    },
    {
      title: 'Chairperson Panel',
      description: 'Manage chair accounts, roles and permissions',
      icon: Shield,
      path: `/chairs${s}`,
      gradient: 'from-orange-500 to-orange-600',
      badge: null,
    },
    {
      title: 'Analytics Dashboard',
      description: 'Registration trends, committee balance and demographics',
      icon: BarChart3,
      path: `/analytics${s}`,
      gradient: 'from-pink-500 to-rose-500',
      badge: null,
    },
    {
      title: 'Messages',
      description: 'Read and respond to contact form submissions',
      icon: Mail,
      path: `/messages${s}`,
      gradient: 'from-red-500 to-red-600',
      badge: counts.unread_messages > 0 ? `${counts.unread_messages} unread` : null,
    },
    {
      title: 'Schedule',
      description: 'Manage conference schedule and events',
      icon: Calendar,
      path: `/schedule${s}`,
      gradient: 'from-green-500 to-emerald-600',
      badge: null,
    },
  ];

  return (
    <AdminLayout title="Admin Dashboard">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : !connectionStatus?.success ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h3 className="text-xl font-semibold text-red-800 mb-2">Database Connection Error</h3>
          <p className="mb-4 text-red-700">{connectionStatus?.message || "Could not connect to database."}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Retry Connection
          </button>
        </div>
      ) : (
        <div className="space-y-8">

          {/* Stats Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Delegate Stats */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-sky-50 rounded-lg">
                    <Users className="h-4 w-4 text-sky-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Delegates</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">{delegateStats.total}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-green-50 rounded-lg py-2">
                  <p className="text-xl font-bold text-green-600">{delegateStats.approved}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Approved</p>
                </div>
                <div className="bg-yellow-50 rounded-lg py-2">
                  <p className="text-xl font-bold text-yellow-600">{delegateStats.pending}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Pending</p>
                </div>
                <div className="bg-red-50 rounded-lg py-2">
                  <p className="text-xl font-bold text-red-500">{delegateStats.rejected}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Rejected</p>
                </div>
              </div>
            </div>

            {/* Chair Stats */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Shield className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Chairs / Co-Chairs</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">{chairStats.total}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-green-50 rounded-lg py-2">
                  <p className="text-xl font-bold text-green-600">{chairStats.approved}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Approved</p>
                </div>
                <div className="bg-yellow-50 rounded-lg py-2">
                  <p className="text-xl font-bold text-yellow-600">{chairStats.pending}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Pending</p>
                </div>
                <div className="bg-red-50 rounded-lg py-2">
                  <p className="text-xl font-bold text-red-500">{chairStats.rejected}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Rejected</p>
                </div>
              </div>
            </div>

            {/* Committees */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">Committees</span>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Globe className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-blue-600">{committees.length}</p>
              <p className="text-xs text-gray-400 mt-1">Active this year</p>
            </div>
          </div>

          {/* Application Status Bar */}
          {totalApps > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Application Status Overview</h3>
                <Link to={isAdminSubdomain ? "/applications" : "/admin/applications"} className="text-xs text-blue-600 hover:underline">View all →</Link>
              </div>
              <div className="flex h-3 w-full rounded-full overflow-hidden gap-0.5">
                {approved > 0 && <div className="bg-green-500 rounded-l-full" style={{ width: `${(approved / totalApps) * 100}%` }} title={`Approved: ${approved}`} />}
                {pending > 0 && <div className="bg-yellow-400" style={{ width: `${(pending / totalApps) * 100}%` }} title={`Pending: ${pending}`} />}
                {rejected > 0 && <div className="bg-red-400 rounded-r-full" style={{ width: `${(rejected / totalApps) * 100}%` }} title={`Rejected: ${rejected}`} />}
              </div>
              <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-600"><div className="w-2.5 h-2.5 rounded-full bg-green-500" /> Approved ({approved})</div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600"><div className="w-2.5 h-2.5 rounded-full bg-yellow-400" /> Pending ({pending})</div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600"><div className="w-2.5 h-2.5 rounded-full bg-red-400" /> Rejected ({rejected})</div>
              </div>
            </div>
          )}

          {/* Navigation Cards Grid */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Management</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {navCards.map((card) => (
                <Link key={card.path} to={card.path} className="group block">
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-gray-200 transition-all duration-200 h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.gradient} shadow-sm`}>
                        <card.icon className="h-5 w-5 text-white" />
                      </div>
                      {card.badge && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full whitespace-nowrap">
                          {card.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-blue-600 transition-colors">{card.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{card.description}</p>
                    <div className="mt-3 flex items-center text-xs font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      Open <ChevronRight className="h-3 w-3 ml-0.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Applications */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Recent Applications</h3>
                <Link to={isAdminSubdomain ? "/applications" : "/admin/applications"} className="text-xs text-blue-600 hover:underline font-medium">View all →</Link>
              </div>
              {recentApplications.length > 0 ? (
                <div className="space-y-3">
                  {recentApplications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{app.full_name}</p>
                        <p className="text-xs text-gray-400 truncate">{app.institution}</p>
                      </div>
                      <div className="ml-3 flex items-center gap-2 shrink-0">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                          app.status === 'approved' ? 'bg-green-100 text-green-700'
                          : app.status === 'rejected' ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {app.status?.charAt(0).toUpperCase() + app.status?.slice(1)}
                        </span>
                        <span className="text-[10px] text-gray-400">{new Date(app.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">No applications yet</div>
              )}
            </div>

            {/* Recent Messages */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Recent Messages</h3>
                <Link to={isAdminSubdomain ? "/messages" : "/admin/messages"} className="text-xs text-blue-600 hover:underline font-medium">View all →</Link>
              </div>
              {recentMessages.length > 0 ? (
                <div className="space-y-3">
                  {recentMessages.map((msg) => (
                    <div key={msg.id} className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium text-gray-900 truncate">{msg.full_name}</p>
                          {!msg.is_read && (
                            <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold bg-red-100 text-red-700 rounded-full">NEW</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{msg.subject}</p>
                      </div>
                      <span className="ml-3 text-[10px] text-gray-400 shrink-0">{new Date(msg.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">No messages yet</div>
              )}
            </div>
          </div>

        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
