import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface Committee {
  id: string;
  name: string;
  abbreviation?: string;
  description: string;
  topics: string[];
  image_url?: string;
  imageUrl?: string; // For frontend compatibility
  chair?: string;
  co_chair?: string;
  chairs?: string[]; // For frontend compatibility
  is_active?: boolean;
  created_at: string;
}

export const useCommittees = () => {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCommittees();
  }, []);

  const fetchCommittees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('committees')
        .select('*')
        .eq('is_active', true) // Only show active committees to public
        .order('name', { ascending: true });
        
      if (error) throw error;
      
      // Transform the data to match the expected format
      const transformedData = (data || []).map(committee => {
        // Extract abbreviation from name if it includes parentheses
        const nameMatch = committee.name.match(/^(.+?)\s*\(([^)]+)\)$/);
        
        return {
          ...committee,
          name: nameMatch ? nameMatch[1].trim() : committee.name,
          abbreviation: nameMatch ? nameMatch[2] : committee.abbreviation,
          imageUrl: committee.image_url || '/images/committees/unga.png', // Provide fallback
          chairs: [committee.chair, committee.co_chair].filter(Boolean), // Convert to array format
        };
      });
      
      setCommittees(transformedData);
    } catch (error: any) {
      console.error('Error fetching committees:', error);
      toast({
        title: "Error",
        description: "Failed to load committees. Showing default committees.",
        variant: "destructive",
      });
      
      // Fallback to static data if database fails
      setCommittees([
                 {
           id: 'static-1',
           name: 'United Nations General Assembly',
           abbreviation: 'UNGA',
           description: 'The main forum for international discussions, where all UN member states collaborate to address global issues.',
           topics: ['Global Refugee Crisis', 'Humanitarian Aid'],
           imageUrl: '/images/committees/unga.png',
           chairs: ['Dr. Jane Smith', 'Prof. John Doe'],
           created_at: '',
         },
         {
           id: 'static-2',
           name: 'World Trade Organization',
           abbreviation: 'WTO',
           description: 'Oversees global trade rules, ensuring stability and fairness in international markets.',
           topics: ['Trade Wars', 'Economic Sanctions'],
           imageUrl: '/images/committees/wto.jpg',
           chairs: ['Ambassador Lee Chang', 'Dr. Maria Rodriguez'],
           created_at: '',
         },
         {
           id: 'static-3',
           name: 'Economic and Social Council',
           abbreviation: 'ECOSOC',
           description: 'ECOSOC coordinates the work of the 14 UN specialized agencies, functional commissions and regional commissions.',
           topics: ['Sustainable Development Goals', 'Digital Economy'],
           imageUrl: '/images/committees/ecosoc.avif',
           chairs: ['Prof. Eliza Wang', 'Dr. Thomas Mueller'],
           created_at: '',
         },
         {
           id: 'static-4',
           name: 'Human Rights Council',
           abbreviation: 'HRC',
           description: 'Responsible for promoting and protecting human rights worldwide and addressing violations.',
           topics: ['Modern Slavery', 'Global Supply Chain'],
           imageUrl: '/images/committees/HRC.png',
           chairs: ['Justice Amara Kone', 'Dr. Robert Park'],
           created_at: '',
         },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return {
    committees,
    loading,
    refetch: fetchCommittees
  };
}; 