import { seasonsData } from '@/data/seasonsData';
import { useContent } from './store';
import type { PastSeason } from './sections';

/** All past seasons, in the order set in Admin → Site content → Seasons. */
export function usePastSeasons(): PastSeason[] {
  return useContent('past_seasons').seasons as PastSeason[];
}

/**
 * One season by its internal ID (e.g. "season3"). Falls back to the built-in
 * data so a legacy page still renders if an admin renames or removes it.
 */
export function usePastSeason(id: string): PastSeason {
  const seasons = usePastSeasons();
  const found = seasons.find(s => s.id === id);
  if (found) return found;
  const builtIn = seasonsData.find(s => s.id === id) ?? seasonsData[0];
  return { ...builtIn, menu_label: builtIn.title, show_in_menu: false };
}

/** Last segment of a season's address, e.g. "/seasons/camu" → "camu". */
export const seasonSlug = (route: string) => (route || '').replace(/\/+$/, '').split('/').pop() || '';

/** Season photo URLs may be site paths ("seasons/x/1.jpg") or uploaded URLs. */
export const photoSrc = (url: string | undefined) =>
  !url ? '' : /^(https?:)?\/\//.test(url) || url.startsWith('/') ? url : `/${url}`;
