// Vercel Routing Middleware. On debat.turonmun.com the bare "/" is served from
// dist/index.html before vercel.json rewrites apply, so link previews would show
// the TuronMUN card. Serve the debate copy (dist/debat/index.html) instead.
export const config = { matcher: ['/', '/index.html'] };

export default function middleware(request) {
  const host = request.headers.get('host') || '';
  if (!/^(debat|debate)\.turonmun\.com$/i.test(host)) return;
  return new Response(null, {
    headers: { 'x-middleware-rewrite': new URL('/debat/index.html', request.url).toString() },
  });
}
