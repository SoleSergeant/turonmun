// Generates src/styles/admin-dark.css: the admin panel's dark theme.
//
// The admin pages are styled with ordinary Tailwind colour classes (bg-white,
// text-gray-700, bg-green-100 …). Rather than add a dark: variant to every
// element, this script finds every colour class the admin uses and writes
// one dark rule for it, scoped to html.admin-theme.dark:
//   • surfaces (white, gray 50–400) darken; borders become faint lines
//   • text grays lighten, keeping their order (900 brightest)
//   • light status tints (green-50, red-100 …) become soft glows of that hue,
//     and their dark text (green-700 …) becomes a light shade
//   • solid fills (panel-600 buttons, red-600, white text) stay as they are
// State variants (hover:, focus:, group-hover:) are written too, so they
// still beat the base rules.
//
// Run: npm run admin-theme   (tests/adminTheme.test.ts fails if it's stale)

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import colors from 'tailwindcss/colors.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIRS = ['src/pages/admin', 'src/components/admin'];
export const OUT = 'src/styles/admin-dark.css';

const PANEL = { 50: '#f3f6fb', 100: '#e5ebf5', 200: '#cad6ea', 300: '#a5b8d8', 400: '#7b94c2', 500: '#5a76ab', 600: '#445f93', 700: '#384e7a', 800: '#2f4164', 900: '#283652', 950: '#1a2336' };
const NEUTRALS = new Set(['gray', 'slate', 'neutral', 'zinc', 'stone']);
const scale = family => (family === 'panel' ? PANEL : colors[family]);

const DARK_NEUTRAL = {
  bg: { 50: '#1b212b', 100: '#212834', 200: '#2a3240', 300: '#353e4d', 400: '#4b5462' },
  text: { 300: '#4f5763', 400: '#6b7380', 500: '#8b94a1', 600: '#a7afba', 700: '#c1c7d0', 800: '#d6dbe2', 900: '#e7eaef', 950: '#f1f3f6' },
  line: { 50: '#1f2630', 100: '#232a35', 200: '#2b3341', 300: '#353e4d', 400: '#4b5462', 500: '#5b6472' },
};
const TINT_ALPHA = { bg: { 50: 0.1, 100: 0.16, 200: 0.24, 300: 0.34 }, line: { 50: 0.12, 100: 0.18, 200: 0.28, 300: 0.4 } };
const TEXT_SHIFT = { 500: 400, 600: 400, 700: 300, 800: 200, 900: 200, 950: 100 };

const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

const TOKEN = /(?:^|[\s"`{'])((?:(?:hover|focus|focus-visible|group-hover|disabled|active|placeholder|print):)*(?:bg|text|border|divide|ring|outline|placeholder)-(?:white|black|transparent|(?:gray|slate|zinc|neutral|stone|panel|green|emerald|red|rose|amber|yellow|orange|purple|violet|sky|teal|cyan|pink|lime|fuchsia|indigo|blue)-(?:50|100|200|300|400|500|600|700|800|900|950))(?:\/\d+)?)(?=[\s"`}']|$)/g;

/** Every colour class used in the admin's source, sorted. */
export function collectTokens() {
  const files = DIRS.flatMap(d => readdirSync(join(ROOT, d), { recursive: true })
    .filter(f => String(f).endsWith('.tsx')).map(f => join(ROOT, d, String(f))));
  const tokens = new Set();
  for (const f of files) for (const m of readFileSync(f, 'utf8').matchAll(TOKEN)) tokens.add(m[1]);
  return [...tokens].sort();
}

/** The dark colour for one utility (no variants), or null to keep the light one. */
function darkColor(prop, color, shade, alpha) {
  if (color === 'white') return prop === 'bg' && !alpha ? 'var(--a-surface)' : null;
  if (!shade || alpha) return null;
  const kind = prop === 'bg' ? 'bg' : prop === 'text' || prop === 'placeholder' ? 'text' : 'line';
  if (NEUTRALS.has(color)) return DARK_NEUTRAL[kind][shade] ?? null;
  const s = scale(color);
  if (!s) return null;
  if (kind === 'text') return TEXT_SHIFT[shade] ? s[TEXT_SHIFT[shade]] : null;
  const a = TINT_ALPHA[kind][shade];
  return a ? rgba(s[400], a) : null;
}

/** The original (light) colour, to re-assert state variants above the base overrides. */
function lightColor(color, shade, alpha) {
  const hex = color === 'white' ? '#ffffff' : color === 'black' ? '#000000' : color === 'transparent' ? null : scale(color)?.[shade];
  if (!hex) return color === 'transparent' ? 'transparent' : null;
  return alpha ? rgba(hex, Number(alpha) / 100) : hex;
}

const esc = s => s.replace(/[:/.[\]]/g, m => `\\${m}`);
const PSEUDO = { hover: ':hover', focus: ':focus', 'focus-visible': ':focus-visible', active: ':active', disabled: ':disabled', placeholder: '::placeholder' };

export function ruleFor(token) {
  const parts = token.split(':');
  const util = parts.pop();
  if (parts.includes('print')) return null;
  const m = util.match(/^(bg|text|border|divide|ring|outline|placeholder)-(white|black|transparent|[a-z]+)(?:-(\d+))?(?:\/(\d+))?$/);
  if (!m) return null;
  const [, prop, color, shade, alpha] = m;
  const value = darkColor(prop, color, shade, alpha) ?? (parts.length ? lightColor(color, shade, alpha) : null);
  if (!value) return null;

  let sel = `.${esc(token)}`;
  for (const v of parts) sel = v === 'group-hover' ? `.group:hover ${sel}` : `${sel}${PSEUDO[v] ?? ''}`;
  if (prop === 'placeholder') sel += '::placeholder';
  if (prop === 'divide') sel += ' > :not([hidden]) ~ :not([hidden])';
  const decl = { bg: 'background-color', text: 'color', placeholder: 'color', border: 'border-color', divide: 'border-color', outline: 'outline-color', ring: '--tw-ring-color' }[prop];
  return `html.admin-theme.dark ${sel} { ${decl}: ${value}; }`;
}

export function build() {
  const rules = collectTokens().map(ruleFor).filter(Boolean);
  // Base utilities first, then state variants, so a hover wins over its element's base colour.
  rules.sort((a, b) => (a.includes(':hover') || a.includes(':focus') || a.includes(':disabled') || a.includes(':active') ? 1 : 0)
    - (b.includes(':hover') || b.includes(':focus') || b.includes(':disabled') || b.includes(':active') ? 1 : 0));
  return `/* Generated by scripts/admin-theme.mjs: do not edit by hand. Run \`npm run admin-theme\`. */\n${rules.join('\n')}\n`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeFileSync(join(ROOT, OUT), build());
  console.log(`Wrote ${OUT}`);
}
