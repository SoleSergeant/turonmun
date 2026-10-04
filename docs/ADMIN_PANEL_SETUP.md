# Admin panel setup (migrations 036–040 and email)

The admin panel overhaul needs four database migrations and one Edge Function.
The code works before these are applied (it falls back to the old behaviour),
but the security fixes, email, seasons and activity log only take effect once
they are in.

## 1. Run the migrations, in order

Supabase Dashboard → SQL Editor → paste and run each file:

| File | What it does |
|---|---|
| `supabase/migrations/036_role_based_security.sql` | Enforces admin roles in the database; scopes chairs to their committee; locks the live-session tables, form settings, matrix countries and storage buckets |
| `supabase/migrations/037_seat_allocation.sql` | `assign_seat` / `unassign_seat` / `change_seat_country` with all allocation rules; unique indexes |
| `supabase/migrations/038_activity_log_and_email.sql` | Activity log (written by triggers) and "already emailed" timestamps |
| `supabase/migrations/039_seasons.sql` | Seasons. **Check `EXISTING_SEASON` (set to 7) before running.** |
| `supabase/migrations/040_site_content.sql` | Admin-editable website content (Admin → Site content) |

All are safe to re-run.

If 037 prints a warning about duplicates, some delegate holds two seats or a
country is assigned twice in one committee. Fix those in **Allocation**, then
run 037 again to add the unique indexes.

### After 036, check that everyone can still work

- Each staff account has role `sg`, `academics`, `logistics` or `registration`
  (old `admin` / `superadmin` rows are converted to `sg`).
- Each chair has role `chair` or `co_chair` **and** a `committee_id`. A chair
  without a committee can sign in but sees nothing.

## 2. Email (Resend)

1. Create a Resend account and verify the sending domain (e.g. `turonmun.uz`).
2. Deploy the function and set its secrets:

```bash
supabase functions deploy send-email
```

```bash
supabase secrets set RESEND_API_KEY=re_xxx EMAIL_FROM="TuronMUN <noreply@turonmun.uz>" EMAIL_REPLY_TO=info@turonmun.uz
```

Only active `sg`, `academics` and `logistics` accounts can send. Every send is
recorded in the activity log.

Templates (acceptance, rejection, allocation, payment reminder, message reply)
live in `src/lib/email.ts`; edit the wording there.

Set `VITE_SITE_URL` in Vercel if the public site is not `https://turonmun.uz`;
it is used for the buttons inside emails.

## 3. Starting the next season

Admin panel → **Seasons** (SG only). Starting a season:

- keeps every application, filed under its season (export any season there);
- archives committee seats, awards and chair announcements;
- deactivates chair / co-chair accounts — reassign them in **Chairs**;
- unlocks awards.

Committees, schedule, resources and form settings carry over; review them.

## 4. Editing the website

Admin → **Site content** (SG only) holds every text, link, image and list on
the public site: season label, contact details, homepage, About page, FAQ,
sponsors, past seasons (which also build the Past Conferences menu),
registration page, contact page, SEO tags.

- Until a section is saved it shows the original built-in text.
- Write `{season}` in any text to insert the Season label from General —
  change that one field when the next season is announced.
- In headlines, wrap words in `*stars*` to highlight them in gold.
- **Reset** on a section returns it to the original text.
- To add a past season: Site content → Seasons → Add season, set its page
  address (e.g. `/seasons/7`), fill it in and upload photos. It gets a page
  and a menu entry automatically.

Whether applications are open, deadlines and fees stay in Admin → Forms.
