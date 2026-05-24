import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface ChairRouteProps {
  children: React.ReactNode;
}

export default function ChairRoute({ children }: ChairRouteProps) {
  const [loading, setLoading] = useState(true);
  const [isChair, setIsChair] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkChairRole = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsChair(false);
          setLoading(false);
          return;
        }

        // Temporary override: allow specific superadmin email to always access chair dashboard
        if (user.email === 'numonovsamandarferps@gmail.com') {
          setIsChair(true);
          setLoading(false);
          return;
        }

        // Check if user is an admin with chair role
        const { data: adminUser, error } = await supabase
          .from('admin_users')
          .select('role')
          .eq('email', user.email)
          .single();

        if (error || !adminUser) {
          setIsChair(false);
          setLoading(false);
          return;
        }

        // Allow access if user is chair, co-chair, director or superadmin
        const allowedRoles = ['chair', 'co-chair', 'co_chair', 'director', 'superadmin'];
        const userRole = (adminUser as any)?.role?.toLowerCase();
        const isChairOrAdmin = userRole && allowedRoles.includes(userRole);
        setIsChair(!!isChairOrAdmin);
        setLoading(false);
      } catch (error) {
        console.error('Error checking chair role:', error);
        setIsChair(false);
        setLoading(false);
      }
    };

    checkChairRole();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-diplomatic-900 via-diplomatic-800 to-diplomatic-700 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gold-400 animate-spin mx-auto mb-4" />
          <p className="text-white">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!isChair && !loading) {
    const isChairSubdomain = window.location.hostname.startsWith('chair.');
    return <Navigate to={isChairSubdomain ? "/" : "/chair-login"} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
