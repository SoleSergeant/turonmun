
import { useState, useEffect } from 'react';
import { supabase, checkAuthState } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Committee, CommitteeFormData, initialFormState } from '../types';

export const useCommitteeData = () => {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initializeAuth = async () => {
      setAuthLoading(true);
      // Check if already authenticated
      const { isAuthenticated } = await checkAuthState();

      if (!isAuthenticated) {
        setIsAuthenticated(false);
        toast({
          title: "Authentication Error",
          description: "You are not authenticated as admin. Some features may be limited.",
          variant: "destructive",
        });
      } else {
        setIsAuthenticated(true);
      }

      setAuthLoading(false);
      fetchCommittees();
    };

    initializeAuth();
  }, []);

  const fetchCommittees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('committees')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;

      setCommittees(data || []);
    } catch (error) {
      console.error('Error fetching committees:', error);
      toast({
        title: "Error",
        description: "Failed to load committees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    committees,
    loading,
    authLoading,
    isAuthenticated,
    setIsAuthenticated,
    fetchCommittees
  };
};
