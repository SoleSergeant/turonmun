import type { Tables } from '@/integrations/supabase/types';

export type Participation = Tables<'participations'>;

export const ROLE_LABEL: Record<string, string> = {
  delegate: 'Delegate', chair: 'Chair', co_chair: 'Co-Chair', volunteer: 'Volunteer',
  secretariat: 'Secretariat', debater: 'Debater', judge: 'Judge',
};

/** "Season 7 · Delegate · UNSC · Germany · Best Delegate" */
export const describe = (p: Participation) =>
  [p.event, ROLE_LABEL[p.role] ?? p.role, p.committee, p.country, p.award].filter(Boolean).join(' · ');
