// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { historyAwards } from '../src/lib/debateHistory.ts';

const team = (id: string) => ({ id, label: id, name: null, position: null });
const rank = (id: string, r: number, judges = 2) => ({ team: team(id), judges, average: 0, byCriterion: {}, oneOnOneWins: 0, rank: r });
const person = (id: string, team_id: string | null) => ({ id, full_name: id, institution: null, team_id, slot: 1 });
const pair = (winnerId: string | null) => ({ pairing: { id: 'p', round: 1, position: 0, a_id: 'x', b_id: 'y' }, aVotes: 0, bVotes: 0, winnerId });

test('winning team members and one-on-one winners get awards', () => {
  const roster = [person('ann', 'A'), person('bob', 'A'), person('cat', 'B'), person('dan', null)];
  const out = historyAwards([rank('A', 1), rank('B', 2)], [pair('ann'), pair('cat'), pair('cat'), pair(null)], roster);
  assert.deepEqual(out, {
    ann: 'Winning team, One-on-one win',
    bob: 'Winning team',
    cat: '2 one-on-one wins',
  });
});

test('no winning team before judges score, with one team, or for unseated people', () => {
  const roster = [person('ann', 'A'), person('cat', 'B')];
  assert.deepEqual(historyAwards([rank('A', 1, 0), rank('B', 1, 0)], [], roster), {});
  assert.deepEqual(historyAwards([rank('A', 1)], [], [person('ann', 'A')]), {});
});

test('tied first place: both teams win', () => {
  const roster = [person('ann', 'A'), person('cat', 'B'), person('eve', 'C')];
  assert.deepEqual(historyAwards([rank('A', 1), rank('B', 1), rank('C', 3)], [], roster), {
    ann: 'Winning team', cat: 'Winning team',
  });
});
