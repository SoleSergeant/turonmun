// Runs after `vite build`: writes dist/debat/index.html, a copy of the app
// page whose link-preview tags describe Turon Debate. Vercel serves it for
// /debat, so Telegram/Instagram previews show the debate card. The app itself
// is unchanged (same scripts), and every other path still gets dist/index.html.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SITE = 'https://www.turonmun.com';
const TITLE = 'Turon Debate';
const DESCRIPTION = 'No countries. Just your voice. Watch how a round works and register for Turon Debate.';
const IMAGE = `${SITE}/debate/og-image.png`;

let html = readFileSync('dist/index.html', 'utf8');
const set = (pattern, replacement) => {
  if (!pattern.test(html)) throw new Error(`debate-meta: tag not found: ${pattern}`);
  html = html.replace(pattern, replacement);
};

set(/<title>[\s\S]*?<\/title>/, `<title>${TITLE}</title>`);
set(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${DESCRIPTION}"`);
set(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${TITLE}"`);
set(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${DESCRIPTION}"`);
set(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${SITE}/debat"`);
set(/<meta property="og:image" content="[^"]*"/, `<meta property="og:image" content="${IMAGE}"`);
set(/<meta name="twitter:image" content="[^"]*"/, `<meta name="twitter:image" content="${IMAGE}"`);
set(/<link rel="icon"[^>]*>/, '<link rel="icon" type="image/svg+xml" href="/debate/favicon.svg" />');

mkdirSync('dist/debat', { recursive: true });
writeFileSync('dist/debat/index.html', html);
console.log('debate-meta: wrote dist/debat/index.html');
