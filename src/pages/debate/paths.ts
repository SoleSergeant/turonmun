import { useSubdomain } from '@/hooks/use-subdomain';

/**
 * Turon Debate lives at the root of debat.turonmun.com, and also at
 * turonmun.com/debat. Pages build their links
 * with useDebatePath() so they work under either address.
 */
export const DEBATE_BASE = '/debat';

/** Public address of the debate site (used by admin links). */
export const DEBATE_SITE_URL = 'https://debat.turonmun.com';

export function useDebatePath() {
  const base = useSubdomain() === 'debate' ? '' : DEBATE_BASE;
  return (path: string) => (path === '/' ? base || '/' : `${base}${path}`);
}
