// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build, ruleFor, OUT } from '../scripts/admin-theme.mjs';

test('dark theme: surfaces darken, text lightens, solids and white text stay', () => {
  assert.equal(ruleFor('bg-white'), 'html.admin-theme.dark .bg-white { background-color: var(--a-surface); }');
  assert.equal(ruleFor('text-white'), null);
  assert.equal(ruleFor('bg-panel-600'), null);
  assert.equal(ruleFor('text-gray-900'), 'html.admin-theme.dark .text-gray-900 { color: #e7eaef; }');
  assert.equal(ruleFor('text-green-700'), 'html.admin-theme.dark .text-green-700 { color: #86efac; }');
  assert.equal(ruleFor('bg-red-50'), 'html.admin-theme.dark .bg-red-50 { background-color: rgba(248, 113, 113, 0.1); }');
  assert.equal(ruleFor('print:bg-gray-900'), null);
});

test('state variants are escaped and kept above base rules', () => {
  assert.equal(ruleFor('hover:bg-gray-50'), 'html.admin-theme.dark .hover\\:bg-gray-50:hover { background-color: #1b212b; }');
  assert.equal(ruleFor('group-hover:text-gray-600'), 'html.admin-theme.dark .group:hover .group-hover\\:text-gray-600 { color: #a7afba; }');
  // A hover with no dark change still re-asserts its colour so a darkened base can't hide it.
  assert.equal(ruleFor('hover:bg-panel-700'), 'html.admin-theme.dark .hover\\:bg-panel-700:hover { background-color: #384e7a; }');
  assert.equal(ruleFor('divide-gray-100'), 'html.admin-theme.dark .divide-gray-100 > :not([hidden]) ~ :not([hidden]) { border-color: #232a35; }');
});

test('generated stylesheet is up to date (run `npm run admin-theme`)', () => {
  assert.equal(readFileSync(new URL(`../${OUT}`, import.meta.url), 'utf8'), build());
});
