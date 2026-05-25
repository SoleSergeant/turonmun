import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Committee {
  id: string;
  name: string;
  abbreviation?: string;
  description: string;
  topics: string[];
  image_url?: string;
  imageUrl?: string;
  chair?: string;
  co_chair?: string;
  chairs?: string[];
  is_active?: boolean;
  created_at: string;
}

const STATIC_FALLBACK: Committee[] = [
  {
    id: 'static-1',
    name: 'United Nations General Assembly',
    abbreviation: 'UNGA',
    description: 'The main forum for international discussions, where all UN member states collaborate to address global issues.',
    topics: ['Global Refugee Crisis', 'Humanitarian Aid'],
    imageUrl: '/images/committees/unga.png',
    chairs: [],
    created_at: '',
  },
  {
    id: 'static-2',
    name: 'World Trade Organization',
    abbreviation: 'WTO',
    description: 'Oversees global trade rules, ensuring stability and fairness in international markets.',
    topics: ['Trade Wars', 'Economic Sanctions'],
    imageUrl: '/images/committees/wto.jpg',
    chairs: [],
    created_at: '',
  },
  {
    id: 'static-3',
    name: 'Economic and Social Council',
    abbreviation: 'ECOSOC',
    description: 'ECOSOC coordinates the work of the 14 UN specialized agencies, functional commissions and regional commissions.',
    topics: ['Sustainable Development Goals', 'Digital Economy'],
    imageUrl: '/images/committees/ecosoc.avif',
    chairs: [],
    created_at: '',
  },
  {
    id: 'static-4',
    name: 'Human Rights Council',
    abbreviation: 'HRC',
    description: 'Responsible for promoting and protecting human rights worldwide and addressing violations.',
    topics: ['Modern Slavery', 'Global Supply Chain'],
    imageUrl: '/images/committees/HRC.png',
    chairs: [],
    created_at: '',
  },
];

const transform = (committee: any) => {
  const nameMatch = committee.name?.match(/^(.+?)\s*\(([^)]+)\)$/);
  return {
    ...committee,
    name: nameMatch ? nameMatch[1].trim() : committee.name,
    abbreviation: nameMatch ? nameMatch[2] : committee.abbreviation,
    imageUrl: committee.image_url || '/images/committees/unga.png',
    chairs: [committee.chair, committee.co_chair].filter(Boolean),
  };
};

export const useCommittees = () => {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Hard 5-second timer — if Supabase hasn't responded, show fallback
    const fallbackTimer = setTimeout(() => {
      if (!cancelled) {
        cancelled = true;
        setCommittees(STATIC_FALLBACK);
        setLoading(false);
      }
    }, 5000);

    supabase
      .from('committees')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        clearTimeout(fallbackTimer);
        if (cancelled) return; // timeout already handled it
        cancelled = true;

        if (error || !data || data.length === 0) {
          setCommittees(STATIC_FALLBACK);
        } else {
          setCommittees(data.map(transform));
        }
        setLoading(false);
      })
      .catch(() => {
        clearTimeout(fallbackTimer);
        if (cancelled) return;
        cancelled = true;
        setCommittees(STATIC_FALLBACK);
        setLoading(false);
      });

    return () => {
      clearTimeout(fallbackTimer);
      cancelled = true;
    };
  }, []);

  return { committees, loading };
};
