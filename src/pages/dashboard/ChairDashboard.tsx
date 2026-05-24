import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  User,
  Calendar,
  MessageSquare,
  FileText,
  Clock,
  MapPin,
  Send,
  X,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  Reply,
  Star,
  Home,
  LogOut,
  Bell,
  Gavel
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

interface ChairSidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

// Use window.location.hostname to adjust paths if needed
const isChairSubdomain = window.location.hostname.startsWith('chair.');

const chairSidebarItems: ChairSidebarItem[] = [
  { id: 'overview', label: 'Overview', icon: Home, path: isChairSubdomain ? '/dashboard' : '/chair-dashboard' },
  { id: 'command', label: 'MUN Command', icon: Gavel, path: isChairSubdomain ? '/command' : '/chair-dashboard/command' },
  { id: 'papers', label: 'Position Papers', icon: FileText, path: isChairSubdomain ? '/papers' : '/chair-dashboard/papers' },
  { id: 'schedule', label: 'Schedule', icon: Calendar, path: isChairSubdomain ? '/schedule' : '/chair-dashboard/schedule' },
  { id: 'delegates', label: 'Delegates', icon: Users, path: isChairSubdomain ? '/delegates' : '/chair-dashboard/delegates' },
];

export default function ChairDashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [committees, setCommittees] = useState<Tables<'committees'>[]>([]);
  const [applications, setApplications] = useState<Tables<'applications'>[]>([]);
  const [positionPapers, setPositionPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chairName, setChairName] = useState('Dr. Sarah Mitchell');
  const [notifications, setNotifications] = useState(3);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('No authenticated user found');
          return;
        }

        // Get admin user record for the authenticated user
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', user.email)
          .single();

        const adminUser = adminData as any;

        if (adminError) {
          console.error('Error fetching admin user:', adminError);
          return;
        }

        if (!adminUser) {
          console.error('User is not an admin/chair');
          return;
        }

        const isSuperAdmin = adminUser.role === 'superadmin';

        // For chairs, use the committee_id from admin_users table
        // For superadmins, show all committees
        let committeeIds: string[] = [];

        if (!isSuperAdmin) {
          if (adminUser.committee_id) {
            committeeIds = [adminUser.committee_id];
          } else {
            console.warn('Chair has no committee_id assigned in admin_users table');
          }
        }

        console.log('Chair Dashboard - Loading data for committees:', committeeIds);

        // Load data - superadmin sees all, chairs see only their committee
        const queries = [];

        if (isSuperAdmin) {
          queries.push(
            supabase.from('committees').select('*'),
            supabase.from('applications').select('*').eq('status', 'approved'),
            supabase.from('position_papers').select('*')
          );
        } else if (committeeIds.length > 0) {
          queries.push(
            supabase.from('committees').select('*').in('id', committeeIds),
            supabase.from('applications').select('*').eq('status', 'approved').in('assigned_committee_id', committeeIds),
            supabase.from('position_papers').select('*').in('committee_id', committeeIds)
          );
        } else {
          // No committee assigned - return empty data
          setCommittees([]);
          setApplications([]);
          setPositionPapers([]);
          setChairName(adminUser.full_name || 'Committee Chair');
          setLoading(false);
          return;
        }

        const [{ data: committeesData }, { data: applicationsData }, { data: papersData }] = await Promise.all(queries);

        console.log('Chair Dashboard - Loaded:', {
          committees: committeesData?.length,
          applications: applicationsData?.length,
          papers: papersData?.length
        });

        setCommittees(committeesData || []);
        setApplications(applicationsData || []);
        setPositionPapers(papersData || []);
        setChairName(adminUser.full_name || 'Committee Chair');

      } catch (error) {
        console.error('Error loading chair data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const currentPath = location.pathname;
    const activeItem = chairSidebarItems.find(item => currentPath === item.path);
    if (activeItem) {
      setActiveTab(activeItem.id);
    }
  }, [location.pathname]);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const assignedDelegates = applications.filter(app => app.assigned_committee_id);
  const submittedPapers = positionPapers.filter(paper => paper.status === 'submitted').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-diplomatic-900 via-diplomatic-800 to-diplomatic-700">
      {/* Chair Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 glass-card border-r border-white/10 z-40">
        <div className="p-6">
          {/* Chair Profile */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-gold-400/40 via-transparent to-diplomatic-400/40 blur-lg" />
              <div className="relative w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-500 rounded-full flex items-center justify-center shadow-glow">
                <User className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold">{chairName}</h3>
              <p className="text-white/60 text-sm">Committee Chair</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {chairSidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const showBadge = item.id === 'papers' && submittedPapers > 0;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 relative ${isActive
                    ? 'bg-gold-500/20 text-gold-400 border border-gold-400/30'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {showBadge && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gold-500 text-white text-xs rounded-full flex items-center justify-center">
                      {submittedPapers}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="absolute bottom-6 left-6 right-6 space-y-2">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-white/70 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {/* Top Bar */}
        <div className="glass-card border-b border-white/10 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-white capitalize">
                {activeTab}
              </h1>
              <p className="text-white/60 text-sm">
                {activeTab === 'overview' && 'Manage your committee and track delegate progress'}
                {activeTab === 'papers' && 'Review and grade position paper submissions'}
                {activeTab === 'messaging' && 'Communicate with your delegates'}
                {activeTab === 'schedule' && 'Manage committee sessions and events'}
                {activeTab === 'delegates' && 'View assigned delegates and their details'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-white/70 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                )}
              </button>
              <div className="text-right">
                <p className="text-sm text-white/60">Total Delegates</p>
                <p className="text-lg font-semibold text-white">{assignedDelegates.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-8">
          <Outlet context={{ committees, applications, positionPapers, loading, assignedDelegates, submittedPapers }} />
        </div>
      </div>
    </div>
  );
}
