import { useSubdomain } from '@/hooks/use-subdomain';

/**
 * Turon Debate lives at turonmun.com/debat for now, and at the root of
 * debat.turonmun.com once that domain is set up. Pages build their links
 * with useDebatePath() so they work under either address.
 */
export const DEBATE_BASE = '/debat';

/** Public address of the debate site (used by admin links). */
export const DEBATE_SITE_URL = 'https://turonmun.com/debat';

export function useDebatePath() {
  const base = useSubdomain() === 'debate' ? '' : DEBATE_BASE;
  return (path: string) => (path === '/' ? base || '/' : `${base}${path}`);
}
