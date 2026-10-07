# Turon Debate — turonmun.com/debat

Turon Debate runs from the same app and database as TuronMUN.

- **Now:** `https://turonmun.com/debat` — no extra DNS, Vercel or Supabase
  setup needed.
- **Later (optional):** `debat.turonmun.com` also works once the domain is
  set up (steps below); the same pages are then served at the root of that
  subdomain. Locally, add `?subdomain=debate` to the URL to try it.

## Pages

| Address | What it is |
|---|---|
| `/debat` | Landing page: YouTube video, intro, key details, how it works, FAQ, Register |
| `/debat/login` | Sign in / create account (same accounts as the MUN site; email or Google) |
| `/debat/register` | Registration form → afterwards the person's status (editable while pending) |

## One-time setup

For `turonmun.com/debat` only step 1 is needed. Steps 2–4 are for the
`debat.turonmun.com` subdomain later.

1. **Database** — run `supabase/migrations/041_turon_debate.sql` in the
   Supabase SQL editor (needs 036, 038 and 040 applied first).
2. **Vercel** — Project → Settings → Domains → add `debat.turonmun.com`.
3. **DNS** (where turonmun.com is managed) — add the record Vercel shows,
   normally `CNAME  debat  →  cname.vercel-dns.com`.
4. **Supabase Auth** — Authentication → URL Configuration → Redirect URLs →
   add `https://debat.turonmun.com/**`. Without this, Google sign-in and
   email-confirmation links fall back to the main site.

## Running it

- **Video, text, open/closed, deadline:** Admin → Site content → Turon Debate.
  Paste the YouTube link (any format: watch, youtu.be, shorts).
- **Registrations:** Admin → Turon Debate (SG and Academics). Filter by
  status, accept / waitlist / reject (one or many), add internal notes,
  email the selected people, export CSV.
- Registration status changes appear in Admin → Activity log.
