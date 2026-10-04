// send-email — sends admin-panel email through Resend.
//
// Deploy:   supabase functions deploy send-email
// Secrets:  supabase secrets set RESEND_API_KEY=re_... EMAIL_FROM="TuronMUN <noreply@turonmun.uz>"
//           (optional) EMAIL_REPLY_TO=info@turonmun.uz
//
// Only active SG / Academics / Logistics accounts may call it. Each recipient
// gets their own copy (nobody sees the other addresses), and every call is
// written to activity_log.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ALLOWED_ROLES = ['sg', 'admin', 'superadmin', 'academics', 'logistics'];
const MAX_PER_CALL = 100; // Resend batch limit

interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const isEmail = (s: unknown): s is string => typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const apiKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('EMAIL_FROM');
  if (!apiKey || !from) return json({ error: 'Email is not configured (RESEND_API_KEY / EMAIL_FROM).' }, 500);

  const url = Deno.env.get('SUPABASE_URL')!;
  const service = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Who is calling?
  const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const { data: { user } } = await service.auth.getUser(jwt);
  if (!user?.email) return json({ error: 'Not signed in' }, 401);

  const { data: admin } = await service
    .from('admin_users')
    .select('full_name, role, is_active')
    .eq('email', user.email)
    .maybeSingle();
  if (!admin?.is_active || !ALLOWED_ROLES.includes(admin.role)) {
    return json({ error: 'Your role cannot send email' }, 403);
  }

  let body: { messages?: OutgoingEmail[]; kind?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  const messages = (body.messages || []).filter(m => isEmail(m?.to) && m.subject && m.html);
  if (messages.length === 0) return json({ error: 'No valid messages' }, 400);
  if (messages.length > MAX_PER_CALL) return json({ error: `At most ${MAX_PER_CALL} messages per call` }, 400);

  const replyTo = Deno.env.get('EMAIL_REPLY_TO');
  const res = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(messages.map(m => ({
      from,
      to: [m.to],
      subject: m.subject,
      html: m.html,
      text: m.text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }))),
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    return json({ error: result?.message || `Resend error ${res.status}` }, 502);
  }

  const kind = body.kind || 'custom';
  await service.from('activity_log').insert({
    actor_email: user.email,
    actor_name: admin.full_name,
    action: 'email_sent',
    entity: 'email',
    summary: `Sent ${messages.length} ${kind.replace(/_/g, ' ')} email${messages.length === 1 ? '' : 's'}`,
    details: { kind, recipients: messages.map(m => m.to), subject: messages[0].subject },
  });

  return json({ sent: messages.length });
});
