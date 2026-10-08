/**
 * What the check-in QR code holds: "turonmun:delegate:<application id>" or
 * "turonmun:chair:<admin_users id>". Only an id, nothing personal.
 */
export type CheckInKind = 'delegate' | 'chair';

export const checkInCode = (kind: CheckInKind, id: string) => `turonmun:${kind}:${id}`;

export function parseCheckInCode(text: string): { kind: CheckInKind; id: string } | null {
  const m = /^turonmun:(delegate|chair):([0-9a-f-]{36})$/i.exec(text.trim());
  return m ? { kind: m[1].toLowerCase() as CheckInKind, id: m[2].toLowerCase() } : null;
}
