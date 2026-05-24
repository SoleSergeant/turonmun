
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// We rely on actual Supabase session logic for authentication

// Configure Supabase client with additional options for better reliability
export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    global: {
      headers: {
        'x-application-name': 'TuronMUN-website',
        'Accept': 'application/json',
      },
    },
  }
);

// Helper function to sign in as admin (simplified for demo)
// Removed due to security risk. Admins should use standard login flows.

// Helper function to check if Supabase connection is working
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('committees').select('id').limit(1);
    if (error) throw error;
    return { success: true, message: 'Connected to Supabase' };
  } catch (error: any) {
    console.error('Supabase connection error:', error.message);
    return { success: false, message: error.message };
  }
};

// Helper function to check current auth state
export const checkAuthState = async () => {
  try {
    // Check for real Supabase session
    const { data: { session }, error } = await supabase.auth.getSession();
    if (session && !error) {
      return { isAuthenticated: true, user: session.user };
    }

    return { isAuthenticated: false, user: null };
  } catch (error) {
    return { isAuthenticated: false, user: null };
  }
};

// Helper function to sign out
export const signOut = async () => {
  try {
    localStorage.removeItem('admin_session');
    return { success: true, message: 'Signed out successfully' };
  } catch (error: any) {
    console.error('Sign out error:', error.message);
    return { success: false, message: error.message };
  }
};
