/**
 * Chairs and delegates share the applications table, told apart by
 * application_type. (Older rows used an "APPLICATION TYPE: chair" line in
 * notes; migration 043 copied that into the column.)
 */
export const isChairApplication = (app: { application_type?: string | null } | null | undefined) =>
  app?.application_type === 'chair';
