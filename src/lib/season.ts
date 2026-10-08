import { supabase } from '@/integrations/supabase/client';

/**
 * The current conference season (migration 039). Admin lists are scoped to
 * it so a new season starts with a clean slate while old applications stay
 * in the database.
 *
 * Resolves to null when the seasons table doesn't exist yet; callers then
 * skip the filter, so the panel keeps working before 039 is applied.
 */
export interface Season {
  number: number;
  name: string;
}

let cached: Promise<Season | null> | null = null;
let cachedAt = 0;
// Short-lived, so a season started in another tab (or by another admin)
// shows up on the next page you open instead of after a full reload.
const TTL_MS = 60_000;

export const getCurrentSeason = (): Promise<Season | null> => {
  if (!cached || Date.now() - cachedAt > TTL_MS) {
    cachedAt = Date.now();
    cached = (async () => {
      const { data, error } = await (supabase.from('seasons' as any) as any)
        .select('number, name')
        .eq('is_current', true)
        .maybeSingle();
      if (error || !data) return null;
      return data as Season;
    })();
  }
  return cached;
};

/** Call after starting a new season. */
export const resetSeasonCache = () => {
  cached = null;
};

/** Adds `.eq('season', n)` when seasons are set up; otherwise returns the query unchanged. */
export function inSeason<Q>(query: Q, season: Season | null): Q {
  return season ? (query as any).eq('season', season.number) : query;
}
