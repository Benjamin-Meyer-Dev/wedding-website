# Roadmap — Pre-Launch Security Checklist

Tracking what's left before publishing the site publicly. Goal: **only invited
guests can reach guest data, and nobody can run up a Supabase bill.**

Last reviewed: 2026-06-09. Supabase project ref: `pveexevsrvgqkkiucbff`.
Hosting: GitHub Pages (static, free — not a billing risk).

---

## ⚠️ Action required before launch

### 1. Disable public sign-up  ← highest priority
Currently `disable_signup: false` — anyone with the public key (it ships in the
bundle) can call `signUp()`. They can't see guest data (RLS blocks it), but they
can spam confirmation emails, bloat the users table, and inflate Monthly Active
Users. You pre-create guest accounts, so public signup isn't needed.

- **Dashboard:** Authentication → Sign In / Providers → turn off
  "Allow new users to sign up".
- **Or one paste** (token from https://supabase.com/dashboard/account/tokens):
  ```powershell
  $token = 'sbp_YOUR_TOKEN_HERE'
  Invoke-RestMethod -Method PATCH `
    -Uri 'https://api.supabase.com/v1/projects/pveexevsrvgqkkiucbff/config/auth' `
    -Headers @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' } `
    -Body '{"disable_signup": true}'
  ```
- **Verify** (should print `True` once disabled):
  ```powershell
  (Invoke-RestMethod 'https://pveexevsrvgqkkiucbff.supabase.co/auth/v1/settings' `
    -Headers @{ apikey='sb_publishable_O9Mgu-P3FUsdDxF1mfzZUg_achoih7b' }).disable_signup
  ```

### 2. Apply the hardening migration
`supabase/migrations/0003_lockdown.sql` is written but **not yet applied**. It
revokes the public key's leftover table SELECT (defense-in-depth) and re-asserts
RLS. Paste it into the Supabase SQL editor and run. Safe + idempotent.

### 3. Run the RLS audit
The audit queries are embedded as comments at the bottom of `0003_lockdown.sql`.
Run them in the SQL editor and confirm:
- RLS = true on `households`, `household_members`, `rsvps`.
- Every policy scopes by `auth.uid()` (directly or via `current_user_household_id`).
  No policy targets the `anon` role or uses a bare `true`.
- `anon` has zero table privileges (after migration 0003).

### 4. Confirm billing safety
Supabase Org → Billing:
- On **Free** → no surprise bill possible (project pauses at limits). Done.
- On **Pro** → turn the **spend cap ON** (converts overage into a pause, not a charge).

### 5. Decide on static content exposure (judgment call, not a bug)
Everything except RSVP is hardcoded in the JS bundle (date, venue, schedule,
travel, FAQ) and is publicly downloadable regardless of login — a static host
can't hide it. Guest list + RSVPs ARE protected (Supabase + RLS). Decide whether
any hardcoded content needs to move behind auth. For most weddings: leave as-is.

---

## ✅ Already verified safe (no action)

- Anonymous reads of all three tables → `401` (RLS active, tested live).
- Anonymous writes → `401` (no anon INSERT grant, tested live).
- No secrets in git history; `.env.local` never committed; the bundled key is the
  publishable (safe-to-expose) kind.
- Anonymous sign-in disabled; phone/SMS auth disabled (keep Twilio off — per-SMS cost).
- Email auto-confirm off, so a raw signup doesn't immediately yield a session.
- GitHub Pages hosting: free, static, soft bandwidth limit only — no bill risk.

---

## Notes
- The repo's `0001_households.sql` is **stale** — the live schema differs (uses a
  `current_user_household_id()` helper and `user_id`-keyed rsvps). Trust the live
  DB / audit output over `0001`, not the other way around.
- The only billing surface is Supabase; no Storage / Edge Functions / Realtime in use.
