// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fillMessage, normalizeUsername, parsePasted, unknownPlaceholder } from '../src/lib/telegramText.ts';

test('usernames: @, links and plain names work; phones and junk are explained', () => {
  for (const raw of ['@aziza_k', 'aziza_k', ' https://t.me/aziza_k ', 't.me/aziza_k?start=1', 'telegram.me/aziza_k/']) {
    assert.deepEqual(normalizeUsername(raw), { username: 'aziza_k', problem: null }, raw);
  }
  assert.equal(normalizeUsername('').problem, 'No Telegram username');
  assert.equal(normalizeUsername('+998 90 123 45 67').problem, 'Phone number: message by hand');
  assert.equal(normalizeUsername('ab').problem, 'Not a valid username');
  assert.equal(normalizeUsername('9lives').problem, 'Not a valid username');
});

test('placeholders fill; first name is derived; unknown ones are caught', () => {
  const t = 'Dear {first_name}, {name}: {committee} as {country} at {event}. {oops}';
  assert.equal(fillMessage(t, { name: 'Aziza Karimova', event: 'TuronMUN Season 8', committee: 'DISEC', country: 'Japan' }),
    'Dear Aziza, Aziza Karimova: DISEC as Japan at TuronMUN Season 8. {oops}');
  assert.equal(fillMessage('{NAME}', { name: 'A' }), 'A');
  assert.equal(unknownPlaceholder(t), '{oops}');
  assert.equal(unknownPlaceholder('Hi {name}'), null);
});

test('pasted lists from sheets', () => {
  assert.deepEqual(parsePasted('Aziza Karimova\t@aziza_k\nBobur, bobur_x\n\nCamila Ruiz @camila_r'), [
    { name: 'Aziza Karimova', username: '@aziza_k' },
    { name: 'Bobur', username: 'bobur_x' },
    { name: 'Camila Ruiz', username: '@camila_r' },
  ]);
});
