/**
 * Guards for URLs and paths that come from users (form fields, query strings).
 * React does not block `javascript:` links, and react-router falls back to a
 * full page load for `//host` paths, so both must be checked before use.
 */

/** The URL if it is plain http(s), otherwise undefined (so no link is made). */
export function safeHref(url: string | null | undefined): string | undefined {
  const value = (url ?? '').trim();
  return /^https?:\/\//i.test(value) ? value : undefined;
}

/** A same-site path for post-login redirects; anything else gives `fallback`. */
export function safeNext(path: string | null | undefined, fallback: string): string {
  // One leading slash only: "//host" and "/\host" leave the site.
  return path && /^\/(?![/\\])/.test(path) && !/[\r\n\t]/.test(path) ? path : fallback;
}
