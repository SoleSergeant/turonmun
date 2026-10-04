/**
 * Chairs and delegates share the applications table. The notes marker
 * written at submit time is the ground truth; application_type is a
 * secondary signal for rows where notes is missing.
 */
export const CHAIR_NOTES_MARKER = 'APPLICATION TYPE: chair';

export const isChairApplication = (app: { application_type?: string | null; notes?: string | null } | null | undefined) =>
  app?.application_type === 'chair' || !!app?.notes?.includes(CHAIR_NOTES_MARKER);
