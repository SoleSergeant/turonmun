/**
 * Telegram message helpers for Admin → Telegram. Pure (tests/telegramText.test.ts).
 * The same username rules as the TuronMUN Sender app (turon_sender.py).
 */

const USERNAME_RE = /^[A-Za-z][A-Za-z0-9_]{3,31}$/;

/** A Telegram username from what people typed (@name, t.me/name …), or why it can't be used. */
export function normalizeUsername(raw: string | null | undefined): { username: string | null; problem: string | null } {
  let s = String(raw ?? '').trim();
  if (!s) return { username: null, problem: 'No Telegram username' };
  s = s.replace(/^(https?:\/\/)?(www\.)?(t\.me|telegram\.me)\//i, '').split('?')[0].replace(/^[/\s]+|[/\s]+$/g, '').replace(/^@+/, '');
  if (/^\+?[\d\s()-]{7,}$/.test(s)) return { username: null, problem: 'Phone number: message by hand' };
  if (!USERNAME_RE.test(s)) return { username: null, problem: 'Not a valid username' };
  return { username: s, problem: null };
}

export const PLACEHOLDERS = ['name', 'first_name', 'event', 'committee', 'country'] as const;
export type Fields = Partial<Record<(typeof PLACEHOLDERS)[number], string>>;

/** Fill {name}, {first_name}, {event}, {committee}, {country}. Unknown {…} stay as typed. */
export function fillMessage(template: string, f: Fields): string {
  const values: Fields = { ...f, first_name: f.first_name ?? (f.name ?? '').trim().split(/\s+/)[0] ?? '' };
  return template.replace(/\{(\w+)\}/g, (all, key: string) => {
    const k = key.toLowerCase() as keyof Fields;
    return (PLACEHOLDERS as readonly string[]).includes(k) ? values[k] ?? '' : all;
  });
}

/** The first {placeholder} the message would send as-is, if any. */
export function unknownPlaceholder(template: string): string | null {
  const m = template.match(/\{(\w*)\}/g)?.find(p => !(PLACEHOLDERS as readonly string[]).includes(p.slice(1, -1).toLowerCase()));
  return m ?? null;
}

/** "Name, @user" / "Name<TAB>user" / "Name @user" per line (pasted from a sheet). */
export function parsePasted(text: string): { name: string; username: string }[] {
  return text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(line => {
    const parts = line.split(/\t|;|,/).map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) return { name: parts[0], username: parts[parts.length - 1] };
    const m = line.match(/^(.*?)\s+(@?\S+)$/);
    return m ? { name: m[1].trim(), username: m[2] } : { name: '', username: line };
  });
}
