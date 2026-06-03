import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminRole } from '@/hooks/useAdminRole';

/**
 * Gate for SG-only pages (Forms, Homepage, Messages).
 * Non-SG admins (academics) are bounced back to the admin dashboard.
 * Non-admins are bounced to the admin login.
 */
const SGRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role, loading } = useAdminRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (role === 'sg') return <>{children}</>;

  // Logged-in admin but not SG → send to dashboard (they have other pages)
  if (role === 'academics') {
    const isAdminSub = window.location.hostname.startsWith('admin.');
    return <Navigate to={isAdminSub ? '/dashboard' : '/dashboard?subdomain=admin'} replace />;
  }

  if (role === 'registration') {
    const isAdminSub = window.location.hostname.startsWith('admin.');
    return <Navigate to={isAdminSub ? '/check-in' : '/check-in?subdomain=admin'} replace />;
  }

  // No admin role at all → kick to admin login
  const isAdminSub = window.location.hostname.startsWith('admin.');
  return <Navigate to={isAdminSub ? '/' : '/admin'} replace />;
};

export default SGRoute;
