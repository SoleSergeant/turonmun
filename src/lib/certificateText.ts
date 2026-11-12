/** Wording on a participation certificate. Pure, so it is unit-tested (tests/certificateText.test.ts). */

export interface CertificateRecord {
  full_name: string;
  event: string;
  role: string;
  committee: string | null;
  country: string | null;
  award: string | null;
}

export interface CertificateText {
  title: string;
  lead: string;
  name: string;
  body: string;
  event: string;
  award: string | null;
  isDebate: boolean;
}

const isDebateRole = (role: string) => role === 'debater' || role === 'judge';

export function certificateText(p: CertificateRecord): CertificateText {
  const at = (s: string | null) => (s ? ` ${s}` : '');
  let body: string;
  switch (p.role) {
    case 'delegate':
      body = p.country && p.committee ? `represented ${p.country} in the ${p.committee}`
        : p.committee ? `participated as a delegate in the ${p.committee}`
        : 'participated as a delegate';
      break;
    case 'chair':
    case 'co_chair':
      body = `served as ${p.role === 'chair' ? 'Chair' : 'Co-Chair'}${p.committee ? ` of the ${p.committee}` : ''}`;
      break;
    case 'volunteer': body = 'served as a volunteer'; break;
    case 'secretariat': body = `served on the Secretariat${p.committee ? ` as${at(p.committee)}` : ''}`; break;
    case 'debater': body = `competed as a debater${p.committee ? ` in ${p.committee}` : ''}`; break;
    case 'judge': body = 'served as an adjudicator'; break;
    default: body = `took part as ${p.role}`;
  }
  // Season rows are stored as "Season 7"; give them the conference name.
  const event = /turon/i.test(p.event) ? p.event : `TuronMUN ${p.event}`;
  return {
    title: p.award ? 'Certificate of Achievement' : 'Certificate of Participation',
    lead: 'This certifies that',
    name: p.full_name.trim(),
    body,
    event: `at ${event}`,
    award: p.award,
    isDebate: isDebateRole(p.role),
  };
}

/** Public check address printed on the certificate and encoded in its QR. */
export const verifyUrl = (siteUrl: string, code: string) =>
  `${siteUrl.replace(/\/+$/, '')}/verify/${encodeURIComponent(code)}`;
