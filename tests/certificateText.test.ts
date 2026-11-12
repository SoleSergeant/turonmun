// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { certificateText, verifyUrl } from '../src/lib/certificateText.ts';

const base = { full_name: ' Ann Lee ', event: 'Season 7', role: 'delegate', committee: 'DISEC', country: 'Germany', award: null };

test('delegate wording, season name and plain participation title', () => {
  const t = certificateText(base);
  assert.equal(t.title, 'Certificate of Participation');
  assert.equal(t.name, 'Ann Lee');
  assert.equal(t.body, 'represented Germany in the DISEC');
  assert.equal(t.event, 'at TuronMUN Season 7');
  assert.equal(t.isDebate, false);
});

test('award switches the title; unseated delegate still reads well', () => {
  assert.equal(certificateText({ ...base, award: 'Best Delegate' }).title, 'Certificate of Achievement');
  assert.equal(certificateText({ ...base, committee: null, country: null }).body, 'participated as a delegate');
});

test('chairs, debaters and judges', () => {
  assert.equal(certificateText({ ...base, role: 'co_chair', country: null }).body, 'served as Co-Chair of the DISEC');
  const d = certificateText({ ...base, role: 'debater', event: 'Turon Debate · November 2026', committee: 'Team A (Proposition)', country: null });
  assert.equal(d.body, 'competed as a debater in Team A (Proposition)');
  assert.equal(d.event, 'at Turon Debate · November 2026');
  assert.equal(d.isDebate, true);
  assert.equal(certificateText({ ...base, role: 'judge' }).body, 'served as an adjudicator');
});

test('verify address', () => {
  assert.equal(verifyUrl('https://www.turonmun.com/', 'AB12CD34EF'), 'https://www.turonmun.com/verify/AB12CD34EF');
});
