import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/**
 * Wraps a route so only authenticated users can access it.
 * Unauthenticated users are redirected to /signup?redirect=<current path>
 * so they land back here after signing up or logging in.
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        // Show nothing (or a spinner) while we resolve session
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-diplomatic-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        const redirectParam = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/signup?redirect=${redirectParam}`} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
