import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminRole } from '@/hooks/useAdminRole';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Gate for admin-panel pages.
 *   sg, academics → allowed (per-page SG-only further restricted by SGRoute)
 *   registration  → redirected to /check-in
 *   anything else → kicked to admin login
 */
const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { role, loading } = useAdminRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (role === 'sg' || role === 'academics') return <>{children}</>;

  const isAdminSub = window.location.hostname.startsWith('admin.');
  const hasSubdomainParam = new URLSearchParams(window.location.search).get('subdomain') === 'admin';

  if (role === 'registration') {
    return <Navigate to={isAdminSub ? '/check-in' : '/check-in?subdomain=admin'} replace />;
  }

  // No matching role → admin login
  return <Navigate to={isAdminSub ? '/' : hasSubdomainParam ? '/?subdomain=admin' : '/admin'} replace />;
};

export default AdminRoute;
