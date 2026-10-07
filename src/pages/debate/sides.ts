import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useContent } from '@/content/store';

export interface SideShare {
  side: string;
  count: number;
  /** Whole-number percentage of registrations that picked one of the listed sides. */
  percent: number;
}

/** Turn per-side counts into shares of the sides listed in Site content. */
export function sideShares(sides: string[], counts: Record<string, number>): { shares: SideShare[]; total: number } {
  const total = sides.reduce((sum, s) => sum + (counts[s] || 0), 0);
  const shares = sides.map(side => {
    const count = counts[side] || 0;
    return { side, count, percent: total ? Math.round((count / total) * 100) : 0 };
  });
  return { shares, total };
}

/**
 * How many registrations picked each side (rejected ones excluded). Public:
 * the debate_side_stats RPC returns totals only, never who picked what.
 */
export function useSideStats() {
  const d = useContent('debate');
  const sides = (d.sides || []).filter(Boolean);
  const { data: counts = {}, refetch } = useQuery({
    queryKey: ['debate-side-stats'],
    enabled: sides.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('debate_side_stats');
      if (error) return {};
      const out: Record<string, number> = {};
      for (const row of (data || []) as { side: string; registrations: number }[]) out[row.side] = Number(row.registrations);
      return out;
    },
  });
  return { sides, ...sideShares(sides, counts), refetch };
}
