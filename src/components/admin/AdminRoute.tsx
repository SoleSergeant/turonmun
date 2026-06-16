import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminRole, AdminRole } from '@/hooks/useAdminRole';

interface AdminRouteProps {
  children: React.ReactNode;
  /**
   * Roles allowed to access the wrapped page. If omitted, defaults to
   * sg + academics + logistics (the union of all admin-panel roles
   * besides the registration desk). Per-page restrictions should pass
   * an explicit list, e.g. allow={['sg','academics']} for academics-
   * scoped pages or allow={['sg','logistics']} for /volunteers.
   */
  allow?: AdminRole[];
}

/**
 * Gate for admin-panel pages.
 *   - role in `allow`        → children render
 *   - role is an admin not in `allow` → redirected to their home page
 *   - registration           → /check-in
 *   - anything else          → kicked to admin login
 */
const AdminRoute: React.FC<AdminRouteProps> = ({ children, allow }) => {
  const { role, loading } = useAdminRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isAdminSub = window.location.hostname.startsWith('admin.');
  const hasSubdomainParam = new URLSearchParams(window.location.search).get('subdomain') === 'admin';
  const suffix = isAdminSub ? '' : '?subdomain=admin';

  const defaultAllow: AdminRole[] = ['sg', 'academics', 'logistics'];
  const allowed = allow ?? defaultAllow;

  // Allowed → render
  if (role && allowed.includes(role)) return <>{children}</>;

  // Registration desk has its own home
  if (role === 'registration') {
    return <Navigate to={`/check-in${suffix}`} replace />;
  }

  // Logistics tried to enter a non-logistics page → send them to volunteers
  if (role === 'logistics') {
    return <Navigate to={`/volunteers${suffix}`} replace />;
  }

  // Academics tried to enter a non-academics page (e.g. /volunteers) → dashboard
  if (role === 'academics') {
    return <Navigate to={`/dashboard${suffix}`} replace />;
  }

  // No matching admin role → admin login
  return <Navigate to={isAdminSub ? '/' : hasSubdomainParam ? '/?subdomain=admin' : '/admin'} replace />;
};

export default AdminRoute;
