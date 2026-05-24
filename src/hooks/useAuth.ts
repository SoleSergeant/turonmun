import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthError {
  message: string;
  code?: string;
}

interface AuthResponse {
  success: boolean;
  error?: AuthError;
  user?: any;
}

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<AuthError | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signup = useCallback(async (
    email: string,
    password: string,
    fullName: string
  ): Promise<AuthResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        const err: AuthError = {
          message: authError.message,
          code: authError.name,
        };
        setError(err);
        return { success: false, error: err };
      }

      if (authData.user) {
        // Insert user data into custom users table
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              email: authData.user.email,
              full_name: fullName,
            },
          ]);

        if (insertError) {
          console.error('Error inserting user data:', insertError);
        }

        return {
          success: true,
          user: authData.user,
        };
      }

      return {
        success: true,
        user: authData.user,
      };
    } catch (err: any) {
      const error: AuthError = {
        message: err.message || 'An error occurred during signup',
        code: err.code,
      };
      setError(error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        const err: AuthError = {
          message: loginError.message,
          code: loginError.name,
        };
        setError(err);
        return { success: false, error: err };
      }

      return {
        success: true,
        user: data.user,
      };
    } catch (err: any) {
      const error: AuthError = {
        message: err.message || 'An error occurred during login',
        code: err.code,
      };
      setError(error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<AuthResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: logoutError } = await supabase.auth.signOut();

      if (logoutError) {
        const err: AuthError = {
          message: logoutError.message,
          code: logoutError.name,
        };
        setError(err);
        return { success: false, error: err };
      }

      return { success: true };
    } catch (err: any) {
      const error: AuthError = {
        message: err.message || 'An error occurred during logout',
        code: err.code,
      };
      setError(error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<AuthResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password-change`,
      });

      if (resetError) {
        const err: AuthError = {
          message: resetError.message,
          code: resetError.name,
        };
        setError(err);
        return { success: false, error: err };
      }

      return { success: true };
    } catch (err: any) {
      const error: AuthError = {
        message: err.message || 'An error occurred during password reset',
        code: err.code,
      };
      setError(error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async (next?: string): Promise<AuthResponse> => {
    setIsLoading(true);
    setError(null);
    
    const callbackUrl = new URL(`${window.location.origin}/auth/callback`);
    if (next) {
      callbackUrl.searchParams.set('next', next);
    }

    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
        },
      });

      if (googleError) {
        const err: AuthError = {
          message: googleError.message,
          code: googleError.name,
        };
        setError(err);
        return { success: false, error: err };
      }

      return {
        success: true,
      };
    } catch (err: any) {
      const error: AuthError = {
        message: err.message || 'An error occurred during Google sign in',
        code: err.code,
      };
      setError(error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    signup,
    login,
    logout,
    resetPassword,
    signInWithGoogle,
    isLoading,
    loading,
    user,
    error,
    setError,
  };
};
