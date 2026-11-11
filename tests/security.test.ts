// Run with: npm test   (Node's built-in runner; no extra packages)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeHref, safeNext } from '../src/lib/safeUrl.ts';
import { toCsv } from '../src/lib/csv.ts';

test('safeHref keeps http(s) links only', () => {
  assert.equal(safeHref('https://example.com/a.pdf'), 'https://example.com/a.pdf');
  assert.equal(safeHref('  HTTP://example.com  '), 'HTTP://example.com');
  for (const bad of [
    'javascript:alert(1)', 'JaVaScRiPt:alert(1)', ' javascript:alert(1)', 'java\tscript:alert(1)',
    'data:text/html,<script>alert(1)</script>', 'vbscript:x', '//evil.example', 'example.com', '', null, undefined,
  ]) {
    assert.equal(safeHref(bad), undefined, String(bad));
  }
});

test('safeNext only allows paths on this site', () => {
  assert.equal(safeNext('/register/delegate?x=1', '/'), '/register/delegate?x=1');
  assert.equal(safeNext('/debat/register', '/'), '/debat/register');
  for (const bad of [
    '//evil.example', '/\\evil.example', 'https://evil.example', 'evil.example', 'javascript:alert(1)',
    '/ok\n//evil.example', '', null, undefined,
  ]) {
    assert.equal(safeNext(bad, '/home'), '/home', String(bad));
  }
});

test('CSV export stops spreadsheet formulas but keeps phones and numbers', () => {
  const cell = (value: string | number) => toCsv([[value]]);
  assert.equal(cell('=HYPERLINK("http://evil.example","x")'), `"'=HYPERLINK(""http://evil.example"",""x"")"`);
  assert.equal(cell('@SUM(1+1)'), `"'@SUM(1+1)"`);
  assert.equal(cell('+cmd|calc'), `"'+cmd|calc"`);
  assert.equal(cell('-2+3+cmd|calc'), `"'-2+3+cmd|calc"`);
  assert.equal(cell('\t=1+1'), `"'\t=1+1"`);
  // Left alone: phone numbers, plain text, real numbers.
  assert.equal(cell('+998 90 123-45-67'), '"+998 90 123-45-67"');
  assert.equal(cell('Ali "the debater"'), '"Ali ""the debater"""');
  assert.equal(cell(-5), '"-5"');
  assert.equal(cell('a=b'), '"a=b"');
});
