import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminRole } from '@/hooks/useAdminRole';

/**
 * Gate for /check-in. SG and registration desk can use it.
 * Academics cannot (per access matrix). Legacy admin/superadmin map to SG.
 */
const CheckInRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role, loading } = useAdminRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (role === 'sg' || role === 'registration') return <>{children}</>;

  // Academics — send to dashboard (no check-in access)
  if (role === 'academics') {
    const isAdminSub = window.location.hostname.startsWith('admin.');
    return <Navigate to={isAdminSub ? '/dashboard' : '/dashboard?subdomain=admin'} replace />;
  }

  // No admin role at all → admin login
  const isAdminSub = window.location.hostname.startsWith('admin.');
  return <Navigate to={isAdminSub ? '/' : '/admin'} replace />;
};

export default CheckInRoute;
