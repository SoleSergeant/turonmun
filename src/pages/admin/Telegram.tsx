import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, Pause, Play, RotateCcw, Save, Send, X } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { confirmAction } from '@/components/admin/ConfirmDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useContent } from '@/content/store';
import { getCurrentSeason, inSeason } from '@/lib/season';
import { readProject } from '@/lib/adminNav';
import { fillMessage, normalizeUsername, parsePasted, unknownPlaceholder, type Fields } from '@/lib/telegramText';
import type { Tables } from '@/integrations/supabase/types';

/**
 * Admin → Telegram: write a message, pick people, queue it. The TuronMUN
 * Sender app on the SG's PC sends the queue from the TuronMUN account,
 * 30–60 s apart, and reports back here (migration 061).
 */

type Batch = Tables<'telegram_batches'>;
type Row = Tables<'telegram_outbox'>;
type Sender = Tables<'telegram_sender'>;
type Template = Tables<'telegram_templates'>;

interface Person {
  key: string;
  type: 'delegate' | 'debater' | 'other';
  id: string | null;
  name: string;
  username: string | null;
  raw: string;
  problem: string | null;
  fields: Fields;
}

const LISTS = {
  'delegates-new': { label: 'Accepted delegates not contacted yet', project: 'mun' },
  'delegates-all': { label: 'All accepted delegates', project: 'mun' },
  'debaters-new': { label: 'Accepted debaters not contacted yet', project: 'debate' },
  'debaters-all': { label: 'All accepted debaters', project: 'debate' },
  'debaters-waitlisted': { label: 'Waitlisted debaters', project: 'debate' },
  paste: { label: 'Paste a list (name and username per line)', project: 'any' },
} as const;
type ListKey = keyof typeof LISTS;

const AVG_GAP_S = 45; // the app waits 30–60 s between messages
const ONLINE_MS = 75_000;
const STATUS_TONE: Record<string, string> = {
  queued: 'bg-gray-100 text-gray-700', sending: 'bg-panel-100 text-panel-800', sent: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800', cancelled: 'bg-gray-100 text-gray-500',
  active: 'bg-panel-100 text-panel-800', paused: 'bg-amber-100 text-amber-800', done: 'bg-green-100 text-green-800',
};
const minutes = (n: number) => Math.max(1, Math.round((n * AVG_GAP_S) / 60));

export default function Telegram() {
  const { toast } = useToast();
  const debate = useContent('debate');
  const general = useContent('general');
  const fail = (title: string, e: any) => toast({ title, description: e?.message, variant: 'destructive' });

  // ── Compose ────────────────────────────────────────────────────────
  const [list, setList] = useState<ListKey>(readProject() === 'debate' ? 'debaters-new' : 'delegates-new');
  const [pasted, setPasted] = useState('');
  const [people, setPeople] = useState<Person[] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set()); // already queued or being sent
  const [text, setText] = useState('Dear {first_name},\n\n');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [queueing, setQueueing] = useState(false);

  const person = (type: Person['type'], id: string | null, name: string, raw: string, fields: Fields): Person => {
    const { username, problem } = normalizeUsername(raw);
    return { key: id ?? `${name}|${raw}`, type, id, name, username, raw, problem: !name.trim() ? 'No name' : problem, fields: { name, ...fields } };
  };

  const loadPeople = useCallback(async () => {
    if (list === 'paste') {
      setPeople(parsePasted(pasted).map((p, i) => ({ ...person('other', null, p.name, p.username, { event: general.site_name }), key: `p${i}` })));
      return;
    }
    setPeople(null);
    try {
      const busy = await supabase.from('telegram_outbox').select('recipient_id').in('status', ['queued', 'sending']).not('recipient_id', 'is', null);
      setBusyIds(new Set((busy.data ?? []).map(r => r.recipient_id!)));
      if (list.startsWith('delegates')) {
        const season = await getCurrentSeason();
        let q = inSeason(supabase.from('applications').select('id, full_name, telegram_username'), season)
          .neq('application_type', 'chair').eq('status', 'approved').order('full_name');
        if (list === 'delegates-new') q = q.eq('contacted', false);
        const [apps, seats] = await Promise.all([q, supabase.from('country_assignments').select('application_id, country, country_name, committees(name)')]);
        if (apps.error) throw apps.error;
        const seat = new Map((seats.data ?? []).map((s: any) => [s.application_id, s]));
        const event = `TuronMUN ${season?.name ?? ''}`.trim();
        setPeople((apps.data ?? []).map(a => {
          const s: any = seat.get(a.id);
          return person('delegate', a.id, a.full_name ?? '', a.telegram_username ?? '', { event, committee: s?.committees?.name ?? '', country: s?.country || s?.country_name || '' });
        }));
      } else {
        let q = supabase.from('debate_registrations').select('id, full_name, telegram').order('full_name');
        q = list === 'debaters-waitlisted' ? q.eq('status', 'waitlisted') : q.eq('status', 'approved');
        if (list === 'debaters-new') q = q.is('contacted_at', null);
        const { data, error } = await q;
        if (error) throw error;
        setPeople((data ?? []).map(d => person('debater', d.id, d.full_name, d.telegram ?? '', { event: debate.name })));
      }
    } catch (e) {
      fail('Could not load the list', e);
      setPeople([]);
    }
  }, [list, pasted, debate.name, general.site_name]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (list !== 'paste') loadPeople(); }, [list]); // eslint-disable-line react-hooks/exhaustive-deps

  // Everyone who can get it starts ticked.
  useEffect(() => {
    setPicked(new Set((people ?? []).filter(p => !p.problem && !(p.id && busyIds.has(p.id))).map(p => p.key)));
  }, [people, busyIds]);

  const loadTemplates = useCallback(async () => {
    const { data } = await supabase.from('telegram_templates').select('*').order('name');
    setTemplates(data ?? []);
  }, []);
  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const chosen = (people ?? []).filter(p => picked.has(p.key));
  const preview = chosen[0] ?? (people ?? []).find(p => !p.problem);
  const bad = unknownPlaceholder(text);

  const saveTemplate = async () => {
    const name = templateName.trim();
    if (!name || !text.trim()) return;
    const { error } = await supabase.from('telegram_templates').upsert({ name, body: text, updated_at: new Date().toISOString() }, { onConflict: 'name' });
    if (error) return fail('Could not save the template', error);
    toast({ title: `Saved "${name}"` });
    setTemplateName('');
    loadTemplates();
  };

  const queue = async () => {
    if (!chosen.length || !text.trim() || bad) return;
    const title = `${LISTS[list].label} · ${new Date().toLocaleDateString()}`;
    if (!(await confirmAction(
      `Queue ${chosen.length} Telegram message${chosen.length === 1 ? '' : 's'} from the TuronMUN account? Sending takes about ${minutes(chosen.length)} minutes once the TuronMUN Sender app is running.`,
      { title: 'Queue messages', confirmLabel: 'Queue' },
    ))) return;
    setQueueing(true);
    try {
      const { data: batch, error } = await supabase.from('telegram_batches').insert({ title }).select().single();
      if (error) throw error;
      const rows = chosen.map((p, i) => ({
        batch_id: batch.id, position: i, recipient_type: p.type, recipient_id: p.id,
        name: p.name, username: p.username!, text: fillMessage(text, p.fields),
      }));
      for (let i = 0; i < rows.length; i += 500) {
        const { error: e } = await supabase.from('telegram_outbox').insert(rows.slice(i, i + 500));
        if (e) throw e;
      }
      toast({ title: `${rows.length} messages queued`, description: sender && online ? 'The Sender app is picking them up.' : 'Open the TuronMUN Sender app to start sending.' });
      loadPeople();
      loadStatus();
    } catch (e) {
      fail('Could not queue the messages', e);
    } finally {
      setQueueing(false);
    }
  };

  // ── Queue status (refreshed every 5 s) ─────────────────────────────
  const [sender, setSender] = useState<Sender | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [counts, setCounts] = useState<Record<string, Record<string, number>>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [now, setNow] = useState(Date.now());

  const loadStatus = useCallback(async () => {
    const [s, b] = await Promise.all([
      supabase.from('telegram_sender').select('*').eq('id', 1).maybeSingle(),
      supabase.from('telegram_batches').select('*').order('created_at', { ascending: false }).limit(12),
    ]);
    setSender(s.data ?? null);
    setBatches(b.data ?? []);
    setNow(Date.now());
    const ids = (b.data ?? []).map(x => x.id);
    if (ids.length) {
      const { data } = await supabase.from('telegram_outbox').select('batch_id, status').in('batch_id', ids);
      const c: Record<string, Record<string, number>> = {};
      for (const r of data ?? []) (c[r.batch_id] ??= {})[r.status] = (c[r.batch_id][r.status] ?? 0) + 1;
      setCounts(c);
    }
  }, []);
  useEffect(() => {
    loadStatus();
    const t = setInterval(() => { if (document.visibilityState === 'visible') loadStatus(); }, 5000);
    return () => clearInterval(t);
  }, [loadStatus]);

  useEffect(() => {
    if (!open) return;
    supabase.from('telegram_outbox').select('*').eq('batch_id', open).order('position').then(({ data }) => setRows(data ?? []));
  }, [open, counts]);

  const online = !!sender?.last_seen && now - new Date(sender.last_seen).getTime() < ONLINE_MS;

  const setBatch = async (b: Batch, status: Batch['status']) => {
    if (status === 'cancelled' && !(await confirmAction(`Cancel "${b.title}"? Messages not sent yet won't go out.`, { title: 'Cancel sending', confirmLabel: 'Cancel sending', danger: true }))) return;
    const { error } = await supabase.from('telegram_batches').update({ status, note: null }).eq('id', b.id);
    if (error) return fail('Could not update', error);
    if (status === 'cancelled') await supabase.from('telegram_outbox').update({ status: 'cancelled' }).eq('batch_id', b.id).eq('status', 'queued');
    loadStatus();
  };
  const retryFailed = async (b: Batch) => {
    const { error } = await supabase.from('telegram_outbox').update({ status: 'queued', error: null, finished_at: null }).eq('batch_id', b.id).eq('status', 'failed');
    if (error) return fail('Could not retry', error);
    await supabase.from('telegram_batches').update({ status: 'active', note: null }).eq('id', b.id);
    loadStatus();
  };

  const visibleLists = useMemo(() => (Object.keys(LISTS) as ListKey[]).filter(k => LISTS[k].project === 'any' || LISTS[k].project === readProject()), []);

  return (
    <AdminLayout title="Telegram">
      <div className="space-y-6">
        {/* Sender status */}
        <section className={`flex flex-wrap items-center gap-3 rounded-xl border p-4 ${online ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
          <span className={`h-2.5 w-2.5 rounded-full ${online ? 'bg-green-500' : 'bg-amber-500'}`} aria-hidden />
          <div className="min-w-0 flex-1 text-sm">
            <p className={`font-semibold ${online ? 'text-green-800' : 'text-amber-800'}`}>
              {online ? `TuronMUN Sender is running${sender?.account ? ` as ${sender.account}` : ''}` : 'TuronMUN Sender is not running'}
            </p>
            <p className={online ? 'text-green-700' : 'text-amber-700'}>
              {online ? sender?.message || 'Waiting for messages.'
                : 'Messages wait in the queue until the app is open on the PC with the TuronMUN Telegram login.'}
            </p>
          </div>
        </section>

        {/* Compose */}
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">New message</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3 min-w-0">
              <label className="block text-sm font-medium text-gray-700" htmlFor="tg-list">Send to</label>
              <select id="tg-list" value={list} onChange={e => setList(e.target.value as ListKey)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                {visibleLists.map(k => <option key={k} value={k}>{LISTS[k].label}</option>)}
              </select>
              {list === 'paste' && (
                <div className="space-y-2">
                  <label className="sr-only" htmlFor="tg-paste">Names and usernames</label>
                  <textarea id="tg-paste" value={pasted} onChange={e => setPasted(e.target.value)} rows={5}
                    placeholder={'Aziza Karimova, @aziza_k\nBobur Aliyev\t@bobur_a'} className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm" />
                  <button type="button" onClick={loadPeople} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Check list</button>
                </div>
              )}
              <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-200">
                {people === null ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
                ) : people.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500">{list === 'paste' ? 'Paste names and usernames, then Check list.' : 'Nobody in this list right now.'}</p>
                ) : (
                  <ul className="divide-y divide-gray-100 text-sm">
                    {people.map(p => {
                      const busy = !!p.id && busyIds.has(p.id);
                      const why = p.problem ?? (busy ? 'Already queued' : null);
                      return (
                        <li key={p.key} className="flex items-center gap-3 px-3 py-2">
                          <input type="checkbox" className="h-4 w-4 rounded border-gray-300" disabled={!!why} checked={picked.has(p.key)} aria-label={`Send to ${p.name}`}
                            onChange={() => setPicked(prev => { const n = new Set(prev); n.has(p.key) ? n.delete(p.key) : n.add(p.key); return n; })} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium text-gray-900">{p.name || '—'}</span>
                            <span className="block truncate text-xs text-gray-500">{p.username ? `@${p.username}` : p.raw || 'no username'}</span>
                          </span>
                          {why && <span className="shrink-0 text-xs text-amber-700">{why}</span>}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              {people && people.length > 0 && (
                <p className="text-sm text-gray-600">
                  {chosen.length} of {people.length} ticked
                  {people.some(p => p.problem) && ` · ${people.filter(p => p.problem).length} can't get a Telegram message (email them instead)`}
                </p>
              )}
            </div>

            <div className="space-y-3 min-w-0">
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-0 flex-1">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="tg-text">Message</label>
                </div>
                {templates.length > 0 && (
                  <select aria-label="Use a saved message" defaultValue="" onChange={e => { const t = templates.find(x => x.id === e.target.value); if (t) setText(t.body); e.target.value = ''; }}
                    className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm">
                    <option value="">Use a saved message…</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
              </div>
              <textarea id="tg-text" value={text} onChange={e => setText(e.target.value)} rows={9} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              <p className="text-xs text-gray-500">
                {'{name}'} full name · {'{first_name}'} · {'{event}'} · {'{committee}'} and {'{country}'} for seated delegates · **bold** and __italic__ work in Telegram.
              </p>
              {bad && <p className="text-sm text-red-700">{bad} isn't a placeholder and would be sent as typed.</p>}
              <div className="flex gap-2">
                <label className="sr-only" htmlFor="tg-tname">Template name</label>
                <input id="tg-tname" value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="Name, to save this message"
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
                <button type="button" onClick={saveTemplate} disabled={!templateName.trim()} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                  <Save className="h-4 w-4" /> Save
                </button>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Preview{preview ? ` · ${preview.name}` : ''}</p>
                <p className="whitespace-pre-wrap text-sm text-gray-800">{preview ? fillMessage(text, preview.fields) : 'Pick someone to see their message.'}</p>
              </div>
              <button type="button" onClick={queue} disabled={queueing || !chosen.length || !text.trim() || !!bad}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-panel-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-panel-700 disabled:opacity-50">
                {queueing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Queue {chosen.length} message{chosen.length === 1 ? '' : 's'}{chosen.length ? ` · about ${minutes(chosen.length)} min` : ''}
              </button>
            </div>
          </div>
        </section>

        {/* Batches */}
        <section className="rounded-xl border bg-white shadow-sm">
          <h2 className="border-b px-5 py-3 text-lg font-semibold text-gray-900">Sending</h2>
          {batches.length === 0 ? (
            <p className="p-5 text-sm text-gray-500">Nothing queued yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {batches.map(b => {
                const c = counts[b.id] ?? {};
                const total = Object.values(c).reduce((a, n) => a + n, 0);
                const sent = c.sent ?? 0, failed = c.failed ?? 0, left = (c.queued ?? 0) + (c.sending ?? 0);
                return (
                  <li key={b.id}>
                    <div className="flex flex-wrap items-center gap-3 px-5 py-3">
                      <button type="button" onClick={() => setOpen(open === b.id ? null : b.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left" aria-expanded={open === b.id}>
                        {open === b.id ? <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" /> : <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />}
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-gray-900">{b.title}</span>
                          <span className="block text-xs text-gray-500">
                            {sent} of {total} sent{failed ? ` · ${failed} failed` : ''}{left && b.status === 'active' ? ` · about ${minutes(left)} min left` : ''}
                            {b.note ? ` · ${b.note}` : ''}
                          </span>
                        </span>
                      </button>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[b.status]}`}>{b.status}</span>
                      <div className="flex gap-1">
                        {b.status === 'active' && left > 0 && <button type="button" onClick={() => setBatch(b, 'paused')} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100" aria-label="Pause"><Pause className="h-4 w-4" /></button>}
                        {b.status === 'paused' && <button type="button" onClick={() => setBatch(b, 'active')} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100" aria-label="Resume"><Play className="h-4 w-4" /></button>}
                        {failed > 0 && b.status !== 'cancelled' && <button type="button" onClick={() => retryFailed(b)} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100" aria-label="Retry failed" title="Retry failed"><RotateCcw className="h-4 w-4" /></button>}
                        {(b.status === 'active' || b.status === 'paused') && left > 0 && <button type="button" onClick={() => setBatch(b, 'cancelled')} className="rounded-md p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-700" aria-label="Cancel"><X className="h-4 w-4" /></button>}
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100" aria-hidden>
                        <div className="h-full bg-green-500" style={{ width: `${total ? (sent / total) * 100 : 0}%` }} />
                      </div>
                    </div>
                    {open === b.id && (
                      <ul className="border-t border-gray-100 bg-gray-50 text-sm">
                        {rows.map(r => (
                          <li key={r.id} className="flex flex-wrap items-center gap-2 px-5 py-2">
                            <span className="min-w-0 flex-1 truncate text-gray-900">{r.name} <span className="text-gray-500">@{r.username}</span></span>
                            {r.error && <span className="text-xs text-red-700">{r.error}</span>}
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[r.status]}`}>{r.status}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
