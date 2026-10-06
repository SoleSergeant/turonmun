/**
 * YouTube video ID from any common link form: watch?v=, youtu.be/,
 * /embed/, /shorts/, /live/ — or a bare 11-character ID.
 */
export function youtubeId(url: string | null | undefined): string | null {
  const s = (url || '').trim();
  if (!s) return null;
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.hostname.endsWith('youtu.be')) return u.pathname.slice(1, 12) || null;
    const v = u.searchParams.get('v');
    if (v) return v.slice(0, 11);
    const m = u.pathname.match(/\/(embed|shorts|live|v)\/([\w-]{11})/);
    return m ? m[2] : null;
  } catch {
    return null;
  }
}

/** Privacy-friendly embed URL (no tracking cookies until the video is played). */
export const youtubeEmbedUrl = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
