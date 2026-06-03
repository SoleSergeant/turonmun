import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          navigate('/login?error=auth_failed');
          return;
        }

        if (session?.user) {
          // User is authenticated, insert/update user data if needed
          const { error: insertError } = await supabase
            .from('users')
            .upsert(
              {
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || session.user.email,
              },
              { onConflict: 'id' }
            );

          if (insertError) {
            console.error('Error upserting user data:', insertError);
          }

          // Get the next redirect path
          const url = new URL(window.location.href);
          const next = url.searchParams.get('next');

          // Subdomain-aware redirection
          const hostname = window.location.hostname;
          const isSubdomain = hostname.startsWith('admin.') || hostname.startsWith('chair.');
          
          if (next) {
            navigate(next);
          } else if (isSubdomain) {
            navigate('/dashboard');
          } else {
            navigate('/');
          }
        } else {
          // No session found, redirect to login
          const hostname = window.location.hostname;
          if (hostname.startsWith('admin.')) {
            navigate('/login');
          } else if (hostname.startsWith('chair.')) {
            navigate('/');
          } else {
            navigate('/login');
          }
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        navigate('/login?error=unexpected');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-diplomatic-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-diplomatic-600 mx-auto mb-4"></div>
        <p className="text-neutral-600">Completing your sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
