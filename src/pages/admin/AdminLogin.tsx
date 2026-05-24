
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signInWithGoogle, isLoading: authLoading } = useAuth();

  useEffect(() => {
    // Check if already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Verify if the user is an admin
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!adminError && adminData) {
          const isAdminSubdomain = window.location.hostname.startsWith('admin.');
          navigate(isAdminSubdomain ? '/dashboard' : '/admin/dashboard');
        }
      }
    };

    checkSession();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithGoogle('/dashboard');
      if (!result.success && result.error) {
        throw result.error;
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "An error occurred during Google login",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast({
        title: "Missing Fields",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Proceed with Supabase auth for regular admin users
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username, // Use username as email for Supabase auth
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Check if the user is an admin
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (adminError || !adminData) {
          await supabase.auth.signOut();
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Login Successful",
            description: "Welcome to the admin dashboard",
          });
          const isAdminSubdomain = window.location.hostname.startsWith('admin.');
          navigate(isAdminSubdomain ? '/dashboard' : '/admin/dashboard');
        }
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-diplomatic-50/50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-diplomatic-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="text-diplomatic-700" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-diplomatic-900">Admin Login</h1>
          <p className="text-neutral-600 mt-2">Sign in to access the TuronMUN admin dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-neutral-700 mb-1">
              Email or Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-diplomatic-500"
              placeholder="admin@turonmun.com"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-diplomatic-500"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-diplomatic-700 text-white py-2 px-4 rounded-md hover:bg-diplomatic-800 transition-colors font-medium disabled:opacity-70"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors disabled:opacity-70 font-medium text-neutral-700"
            disabled={loading || authLoading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-diplomatic-600 hover:text-diplomatic-800 text-sm">
            Return to Website
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
