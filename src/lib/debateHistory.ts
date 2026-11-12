import type { Debater, PairResult, TeamRanking } from './debateEvent';

/**
 * Awards to store in participation history, per registration id:
 * "Winning team" for members of the top-ranked team(s) (only once judges
 * have scored and there are 2+ teams), plus one-on-one wins.
 */
export function historyAwards(ranking: TeamRanking[], pairs: PairResult[], roster: Debater[]): Record<string, string> {
  const winningTeams = new Set(
    ranking.length > 1 ? ranking.filter(r => r.rank === 1 && r.judges > 0).map(r => r.team.id) : [],
  );
  const wins = new Map<string, number>();
  for (const p of pairs) if (p.winnerId) wins.set(p.winnerId, (wins.get(p.winnerId) ?? 0) + 1);

  const out: Record<string, string> = {};
  for (const d of roster) {
    const parts: string[] = [];
    if (d.team_id && winningTeams.has(d.team_id)) parts.push('Winning team');
    const n = wins.get(d.id) ?? 0;
    if (n) parts.push(n === 1 ? 'One-on-one win' : `${n} one-on-one wins`);
    if (parts.length) out[d.id] = parts.join(', ');
  }
  return out;
}
