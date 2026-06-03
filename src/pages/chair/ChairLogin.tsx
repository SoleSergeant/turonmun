import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const ChairLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();
    const { signInWithGoogle, isLoading: authLoading } = useAuth();

    // If a session already exists, verify chair role and redirect
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: adminData, error } = await supabase
                    .from('admin_users')
                    .select('role')
                    .eq('email', session.user.email)
                    .single();

                // Roles that are allowed to access the chair dashboard
                const allowedRoles = ['chair', 'co-chair', 'co_chair', 'director', 'superadmin'];
                const userRole = (adminData as any)?.role?.toLowerCase();
                
                // Only redirect if they have an allowed role
                if (!error && userRole && allowedRoles.includes(userRole)) {
                    const isChairSubdomain = window.location.hostname.startsWith('chair.');
                    navigate(isChairSubdomain ? '/dashboard' : '/chair-dashboard');
                }
                // If not a chair, just stay on login page (don't sign out)
            }
        };
        checkSession();
    }, [navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast({
                title: 'Missing Fields',
                description: 'Please enter both email and password',
                variant: 'destructive',
            });
            return;
        }
        try {
            setLoading(true);
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;

            if (data?.user) {
                // Verify that the authenticated user is a chair
                const { data: adminData, error: adminError } = await supabase
                    .from('admin_users')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                // Roles that are allowed to access the chair dashboard (case-insensitive check)
                const allowedRoles = ['chair', 'co-chair', 'co_chair', 'director', 'superadmin'];
                const userRole = (adminData as any)?.role?.toLowerCase();

                if (adminError || !userRole || !allowedRoles.includes(userRole)) {
                    console.error('Access Denied details:', { adminError, role: userRole, email: data.user.email });
                    await supabase.auth.signOut();
                    toast({
                        title: 'Access Denied',
                        description: `Role "${userRole || 'not found'}" does not have permission for the Chair Dashboard.`,
                        variant: 'destructive',
                    });
                    return;
                }

                toast({
                    title: 'Login Successful',
                    description: 'Welcome to the Chair Dashboard',
                });
                const isChairSubdomain = window.location.hostname.startsWith('chair.');
                navigate(isChairSubdomain ? '/dashboard' : '/chair-dashboard');
            }
        } catch (err: any) {
            toast({
                title: 'Login Failed',
                description: err.message || 'An error occurred during login',
                variant: 'destructive',
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
                    <h1 className="text-2xl font-bold text-diplomatic-900">Chair Login</h1>
                    <p className="text-neutral-600 mt-2">Sign in to manage your committee</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-diplomatic-500"
                            placeholder="chair@turonmun.com"
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
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-4">
                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                setLoading(true);
                                const result = await signInWithGoogle('/dashboard');
                                if (!result.success && result.error) {
                                    throw result.error;
                                }
                            } catch (error: any) {
                                toast({
                                    title: 'Login Failed',
                                    description: error.message || 'An error occurred during Google login',
                                    variant: 'destructive',
                                });
                                setLoading(false);
                            }
                        }}
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
            </div>
        </div>
    );
};

export default ChairLogin;
