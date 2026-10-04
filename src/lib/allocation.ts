import { supabase } from '@/integrations/supabase/client';
import { getCountryCode } from '@/utils/countryCodes';

/**
 * Seat allocation — the single place that writes country_assignments.
 *
 * Every write goes through the assign_seat / unassign_seat /
 * change_seat_country database functions (migration 037), which enforce the
 * rules server-side. `checkSeat` mirrors those rules so pages can explain a
 * refusal before the round-trip, and so the direct-write fallback (used only
 * until migration 037 is applied) stays just as strict.
 */

export interface SeatCommittee {
  id: string;
  name: string;
  total_spots?: number | null;
  countries?: string[] | null;
}

export interface SeatDelegate {
  id: string;
  full_name: string;
  status?: string | null;
  payment_status?: string | null;
}

export interface SeatAssignment {
  id: string;
  application_id: string;
  committee_id: string;
  country: string | null;
  country_name?: string | null;
}

const norm = (s: string | null | undefined) => (s || '').trim().toLowerCase();

export const seatCountry = (a: Pick<SeatAssignment, 'country' | 'country_name'>) =>
  a.country || a.country_name || '';

/** De-duplicated roster (case-insensitive, order kept). Empty = no roster. */
export const committeeRoster = (c: SeatCommittee): string[] => {
  const seen = new Set<string>();
  return (c.countries || []).filter(x => {
    const k = norm(x);
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

export const committeeCapacity = (c: SeatCommittee) => {
  const roster = committeeRoster(c);
  return roster.length > 0 ? roster.length : (c.total_spots ?? 20);
};

/** Returns a human-readable reason the seat can't be assigned, or null. */
export function checkSeat(opts: {
  delegate: SeatDelegate | undefined;
  committee: SeatCommittee | undefined;
  country: string;
  assignments: SeatAssignment[];
  committeeNames?: Record<string, string>;
}): string | null {
  const { delegate, committee, assignments } = opts;
  const country = opts.country.trim();
  if (!country) return 'Pick a country first.';
  if (!delegate) return 'Delegate not found.';
  if (!committee) return 'Committee not found.';
  if (delegate.status && delegate.status !== 'approved') return `${delegate.full_name} is not an approved delegate.`;
  if (delegate.payment_status !== 'paid') return `${delegate.full_name} has not paid yet. Only paid delegates can be allocated.`;

  const existing = assignments.find(a => a.application_id === delegate.id);
  if (existing) {
    const where = opts.committeeNames?.[existing.committee_id] ?? 'another committee';
    return `${delegate.full_name} already has a seat in ${where}. Unassign it first.`;
  }

  const inCommittee = assignments.filter(a => a.committee_id === committee.id);
  if (inCommittee.some(a => norm(seatCountry(a)) === norm(country))) {
    return `${country} is already taken in ${committee.name}.`;
  }

  const roster = committeeRoster(committee);
  if (roster.length > 0 && !roster.some(r => norm(r) === norm(country))) {
    return `${country} is not on ${committee.name}'s country roster. Add it in Committees first.`;
  }

  const capacity = committeeCapacity(committee);
  if (inCommittee.length >= capacity) return `${committee.name} is full (${inCommittee.length} of ${capacity} seats).`;
  return null;
}

const codeFor = (country: string) => (getCountryCode(country) || '').toUpperCase() || null;

// PostgREST answers PGRST202 when the function doesn't exist yet.
const missingFunction = (error: { code?: string } | null) => error?.code === 'PGRST202';

export async function assignSeat(applicationId: string, committeeId: string, country: string): Promise<SeatAssignment> {
  const label = country.trim();
  const { data, error } = await (supabase.rpc as any)('assign_seat', {
    p_application_id: applicationId,
    p_committee_id: committeeId,
    p_country: label,
    p_country_code: codeFor(label),
  });
  if (!error) return data as SeatAssignment;
  if (!missingFunction(error)) throw error;

  const { data: row, error: insErr } = await (supabase.from('country_assignments') as any)
    .insert({
      application_id: applicationId,
      committee_id: committeeId,
      country: label,
      country_name: label,
      country_code: codeFor(label),
    })
    .select()
    .single();
  if (insErr) throw insErr;
  await (supabase.from('applications') as any).update({ assigned_committee_id: committeeId }).eq('id', applicationId);
  return row as SeatAssignment;
}

export async function unassignSeat(assignment: Pick<SeatAssignment, 'id' | 'application_id'>): Promise<void> {
  const { error } = await (supabase.rpc as any)('unassign_seat', { p_assignment_id: assignment.id });
  if (!error) return;
  if (!missingFunction(error)) throw error;

  const { error: delErr } = await supabase.from('country_assignments').delete().eq('id', assignment.id);
  if (delErr) throw delErr;
  await (supabase.from('applications') as any).update({ assigned_committee_id: null }).eq('id', assignment.application_id);
}

export async function changeSeatCountry(assignmentId: string, country: string): Promise<void> {
  const label = country.trim();
  const { error } = await (supabase.rpc as any)('change_seat_country', {
    p_assignment_id: assignmentId,
    p_country: label,
    p_country_code: codeFor(label),
  });
  if (!error) return;
  if (!missingFunction(error)) throw error;

  const { error: updErr } = await (supabase.from('country_assignments') as any)
    .update({ country: label, country_name: label, country_code: codeFor(label) })
    .eq('id', assignmentId);
  if (updErr) throw updErr;
}
