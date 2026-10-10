import { supabase } from '@/integrations/supabase/client';

/**
 * Turon Debate event day (migration 045): teams, one-on-one pairings,
 * judges' score sheets and votes, and the rankings built from them.
 */

export interface DebateTeam { id: string; label: string; name: string | null; position: string | null }
export interface Debater { id: string; full_name: string; institution: string | null; team_id: string | null; slot: number | null }
export interface Pairing { id: string; round: number; position: number; a_id: string; b_id: string }
export interface ScoreSheet {
  id: string; judge_id: string; judge_name: string | null; team_id: string;
  scores: Record<string, number>; total: number; notes: string | null; updated_at: string;
}
export interface PairVote { id: string; judge_id: string; judge_name: string | null; pairing_id: string; winner_id: string }
export interface Criterion { label: string; max: number }

export interface EventData {
  teams: DebateTeam[];
  roster: Debater[];
  pairings: Pairing[];
  scores: ScoreSheet[];
  votes: PairVote[];
}

const table = (name: string) => supabase.from(name as any) as any;

/** Everything the judging panel and the results need. Judges get names via debate_roster(), never contact details. */
export async function loadEvent(): Promise<EventData> {
  const [teams, roster, pairings, scores, votes] = await Promise.all([
    table('debate_teams').select('id, label, name, position').order('label'),
    (supabase.rpc as any)('debate_roster'),
    table('debate_pairings').select('id, round, position, a_id, b_id').order('round').order('position'),
    table('debate_scores').select('*'),
    table('debate_pair_votes').select('*'),
  ]);
  const err = teams.error || roster.error || pairings.error || scores.error || votes.error;
  if (err) throw err;
  return {
    teams: teams.data || [],
    roster: roster.data || [],
    pairings: pairings.data || [],
    scores: (scores.data || []).map((s: any) => ({ ...s, total: Number(s.total) })),
    votes: votes.data || [],
  };
}

/** "A3" — team letter and seat number. */
export const seatLabel = (d: Debater | undefined, teams: DebateTeam[]) => {
  if (!d?.team_id) return '';
  const t = teams.find(x => x.id === d.team_id);
  return t ? `${t.label}${d.slot ?? ''}` : '';
};

export const sheetTotal = (scores: Record<string, number>, criteria: Criterion[]) =>
  criteria.reduce((sum, c) => sum + Math.min(Number(c.max) || 0, Math.max(0, Number(scores[c.label]) || 0)), 0);

export interface TeamRanking {
  team: DebateTeam;
  judges: number;
  /** Average of the judges' totals. */
  average: number;
  /** Average per criterion. */
  byCriterion: Record<string, number>;
  oneOnOneWins: number;
  rank: number;
}

export interface PairResult {
  pairing: Pairing;
  aVotes: number;
  bVotes: number;
  /** Majority winner, or null while undecided / tied. */
  winnerId: string | null;
}

export function pairResults(data: EventData): PairResult[] {
  return data.pairings.map(p => {
    const v = data.votes.filter(x => x.pairing_id === p.id);
    const aVotes = v.filter(x => x.winner_id === p.a_id).length;
    const bVotes = v.filter(x => x.winner_id === p.b_id).length;
    return { pairing: p, aVotes, bVotes, winnerId: aVotes > bVotes ? p.a_id : bVotes > aVotes ? p.b_id : null };
  });
}

export function teamRankings(data: EventData, criteria: Criterion[]): TeamRanking[] {
  const pairs = pairResults(data);
  const teamOf = (id: string | null) => data.roster.find(d => d.id === id)?.team_id;
  const rows = data.teams.map(team => {
    const sheets = data.scores.filter(s => s.team_id === team.id);
    const byCriterion: Record<string, number> = {};
    criteria.forEach(c => {
      byCriterion[c.label] = sheets.length ? sheets.reduce((s, x) => s + (Number(x.scores?.[c.label]) || 0), 0) / sheets.length : 0;
    });
    // Recompute totals from the current criteria so a renamed criterion can't skew rankings.
    const average = sheets.length ? sheets.reduce((s, x) => s + sheetTotal(x.scores || {}, criteria), 0) / sheets.length : 0;
    const oneOnOneWins = pairs.filter(r => r.winnerId && teamOf(r.winnerId) === team.id).length;
    return { team, judges: sheets.length, average, byCriterion, oneOnOneWins, rank: 0 };
  });
  rows.sort((a, b) => b.average - a.average || b.oneOnOneWins - a.oneOnOneWins);
  rows.forEach((r, i) => { r.rank = i > 0 && r.average === rows[i - 1].average && r.oneOnOneWins === rows[i - 1].oneOnOneWins ? rows[i - 1].rank : i + 1; });
  return rows;
}

/**
 * Pairs debaters from different teams at random. With an odd number, one
 * person sits out (returned as `bye`). Falls back to allowing a same-team
 * pair only if no all-cross-team arrangement is found.
 */
export function generatePairings(people: Debater[]): { pairs: [Debater, Debater][]; bye: Debater | null } {
  const shuffle = <T,>(arr: T[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  for (let attempt = 0; attempt < 300; attempt++) {
    const pool = shuffle(people);
    const pairs: [Debater, Debater][] = [];
    let ok = true;
    while (pool.length > 1) {
      const a = pool.shift()!;
      const idx = pool.findIndex(p => p.team_id !== a.team_id);
      if (idx < 0) { ok = false; break; }
      pairs.push([a, pool.splice(idx, 1)[0]]);
    }
    if (ok) return { pairs, bye: pool[0] ?? null };
  }
  const pool = shuffle(people);
  const pairs: [Debater, Debater][] = [];
  while (pool.length > 1) pairs.push([pool.shift()!, pool.shift()!]);
  return { pairs, bye: pool[0] ?? null };
}

/** Next free seat number in a team (1, 2, 3 …). */
export function nextSlot(roster: Debater[], teamId: string): number {
  const used = new Set(roster.filter(d => d.team_id === teamId).map(d => d.slot));
  let n = 1;
  while (used.has(n)) n++;
  return n;
}

export const TEAM_TONES = ['bg-debate-blue', 'bg-debate-maroon'] as const;
