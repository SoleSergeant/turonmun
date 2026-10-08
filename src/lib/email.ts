import { supabase } from '@/integrations/supabase/client';

/**
 * Admin-panel email. Sends through the send-email Edge Function
 * (supabase/functions/send-email), which checks the caller's role,
 * delivers via Resend and writes activity_log.
 */

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export type EmailKind =
  | 'decision_accepted'
  | 'decision_rejected'
  | 'seat_assigned'
  | 'payment_reminder'
  | 'message_reply'
  | 'custom';

const BATCH = 100;

export interface SendResult {
  sent: number;
  /** Lower-cased addresses that were actually emailed. */
  delivered: Set<string>;
  /** Addresses the server refused as invalid. */
  skipped: string[];
}

export class EmailError extends Error {
  constructor(message: string, public result: SendResult) {
    super(message);
  }
}

/** True when this address was emailed in `result`. */
export const wasDelivered = (result: SendResult, email: string | null | undefined) =>
  !!email && result.delivered.has(email.trim().toLowerCase());

/**
 * Sends in batches of 100. Throws EmailError when a batch fails; its
 * `result` still lists who was emailed before the failure, so callers can
 * record those people and not email them twice.
 */
export async function sendEmails(messages: OutgoingEmail[], kind: EmailKind): Promise<SendResult> {
  const result: SendResult = { sent: 0, delivered: new Set(), skipped: [] };
  for (let i = 0; i < messages.length; i += BATCH) {
    const chunk = messages.slice(i, i + BATCH);
    const { data, error } = await supabase.functions.invoke('send-email', { body: { messages: chunk, kind } });
    if (error) {
      // FunctionsHttpError carries the JSON body with our message.
      let detail = error.message;
      try {
        const ctx = (error as any).context;
        if (ctx?.json) detail = (await ctx.json())?.error || detail;
      } catch { /* keep generic message */ }
      throw new EmailError(result.sent > 0 ? `${detail} (${result.sent} sent before the error)` : detail, result);
    }
    const delivered: string[] = (data as any)?.delivered ?? chunk.map(m => m.to);
    delivered.forEach(e => result.delivered.add(e.trim().toLowerCase()));
    result.skipped.push(...((data as any)?.skipped ?? []));
    result.sent += delivered.length;
  }
  return result;
}

/** The result carried by a failed send, or an empty one. */
export const partialResult = (err: unknown): SendResult =>
  err instanceof EmailError ? err.result : { sent: 0, delivered: new Set(), skipped: [] };

// ── Templates ──────────────────────────────────────────────────────────

const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) || 'https://www.turonmun.com';

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Plain text → HTML paragraphs (escaped). */
export const textToHtml = (text: string) =>
  text
    .split(/\n{2,}/)
    .map(p => `<p style="margin:0 0 14px">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');

const layout = (bodyHtml: string, cta?: { label: string; href: string }) => `<!doctype html>
<html><body style="margin:0;background:#f4f6fb;font-family:Inter,Segoe UI,Arial,sans-serif;color:#1f2937">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden">
        <tr><td style="background:#0a1a30;padding:20px 28px;color:#f7a31c;font-size:20px;font-weight:700;letter-spacing:.5px">TuronMUN</td></tr>
        <tr><td style="padding:28px;font-size:15px;line-height:1.6">
          ${bodyHtml}
          ${cta ? `<p style="margin:24px 0 0"><a href="${cta.href}" style="display:inline-block;background:#f7a31c;color:#0a1a30;text-decoration:none;font-weight:600;padding:10px 20px;border-radius:8px">${escapeHtml(cta.label)}</a></p>` : ''}
        </td></tr>
        <tr><td style="padding:16px 28px;background:#f9fafb;color:#6b7280;font-size:12px">TuronMUN · Fergana, Uzbekistan · <a href="${SITE_URL}" style="color:#6b7280">${SITE_URL.replace(/^https?:\/\//, '')}</a></td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

const firstName = (full: string) => (full || '').trim().split(/\s+/)[0] || 'there';

export const templates = {
  decisionAccepted: (p: { to: string; name: string }): OutgoingEmail => ({
    to: p.to,
    subject: 'Your TuronMUN application has been accepted',
    html: layout(
      textToHtml(
        `Dear ${firstName(p.name)},\n\nCongratulations! Your application to TuronMUN has been accepted.\n\n` +
        `Next step: complete your participation fee. Once your payment is confirmed you will be allocated a committee and country.\n\n` +
        `You can follow your status any time in your delegate dashboard.\n\nBest regards,\nTuronMUN Secretariat`,
      ),
      { label: 'Open my dashboard', href: `${SITE_URL}/dashboard` },
    ),
  }),

  decisionRejected: (p: { to: string; name: string }): OutgoingEmail => ({
    to: p.to,
    subject: 'Your TuronMUN application',
    html: layout(
      textToHtml(
        `Dear ${firstName(p.name)},\n\nThank you for applying to TuronMUN. We received many strong applications this season, ` +
        `and unfortunately we are unable to offer you a place this time.\n\n` +
        `We hope to see you apply again in a future season.\n\nBest regards,\nTuronMUN Secretariat`,
      ),
    ),
  }),

  seatAssigned: (p: { to: string; name: string; committee: string; country: string }): OutgoingEmail => ({
    to: p.to,
    subject: `Your TuronMUN allocation: ${p.country} in ${p.committee}`,
    html: layout(
      textToHtml(
        `Dear ${firstName(p.name)},\n\nYou have been allocated to represent ${p.country} in ${p.committee}.\n\n` +
        `Your committee page has the study guide, announcements from your chairs and the position paper upload.\n\n` +
        `Best regards,\nTuronMUN Secretariat`,
      ),
      { label: 'Open my committee', href: `${SITE_URL}/dashboard/committee` },
    ),
  }),

  paymentReminder: (p: { to: string; name: string; amount?: number | null }): OutgoingEmail => ({
    to: p.to,
    subject: 'Reminder: complete your TuronMUN participation fee',
    html: layout(
      textToHtml(
        `Dear ${firstName(p.name)},\n\nYour application has been accepted, but we have not received your participation fee yet` +
        `${p.amount ? ` (${p.amount.toLocaleString()} UZS)` : ''}.\n\n` +
        `Committee and country allocation is only done for delegates whose payment is confirmed, so please complete it soon.\n\n` +
        `If you have already paid, reply to this email with your receipt and we will update your status.\n\nBest regards,\nTuronMUN Secretariat`,
      ),
      { label: 'Open my dashboard', href: `${SITE_URL}/dashboard` },
    ),
  }),

  messageReply: (p: { to: string; name: string; originalSubject: string; reply: string }): OutgoingEmail => ({
    to: p.to,
    subject: `Re: ${p.originalSubject || 'Your message to TuronMUN'}`,
    html: layout(`<p style="margin:0 0 14px">Dear ${escapeHtml(firstName(p.name))},</p>${textToHtml(p.reply)}<p style="margin:0">TuronMUN Secretariat</p>`),
    text: p.reply,
  }),

  custom: (p: { to: string; subject: string; body: string }): OutgoingEmail => ({
    to: p.to,
    subject: p.subject,
    html: layout(textToHtml(p.body)),
    text: p.body,
  }),
};
