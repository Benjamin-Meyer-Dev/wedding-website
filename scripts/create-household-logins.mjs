// Creates one login per household that doesn't have one yet, and writes the
// usernames + passwords to household-logins.csv for printing the invitations.
//
// Username = the household's distinct guest surnames, alphabetical, max two,
// lowercased with accents/spaces/punctuation stripped:
//   Anna & Tom Smith        -> smith
//   Anna Smith & Tom Jones  -> jonessmith
//   Garcia family (5)       -> garcia
//   second Smith household  -> smith2
// The login form (src/pages/Login.jsx) normalises what guests type the same
// way, so "Smith Jones" or "smith-jones" both work.
//
// Needs SUPABASE_SERVICE_ROLE_KEY in .env.local (Dashboard → Project Settings
// → API). That key bypasses all security — it lives only on this machine and
// must never get a VITE_ prefix or go anywhere near the site bundle.
//
// Usage:
//   node --env-file=.env.local scripts/create-household-logins.mjs           dry run: prints the plan
//   node --env-file=.env.local scripts/create-household-logins.mjs --apply   creates the logins
//   add --password=<value> to give every new login that password instead of a
//   random one (testing only: anyone who guesses a surname can then sign in)
//
// household-logins.csv holds live passwords: it is gitignored — keep it that way,
// and delete it once the invitations are printed.

import { createClient } from '@supabase/supabase-js'
import { randomInt } from 'node:crypto'
import { appendFileSync, existsSync } from 'node:fs'

const USERNAME_DOMAIN = 'wedding.local' // must match src/pages/Login.jsx
const MAX_SURNAMES = 2
const OUT_FILE = 'household-logins.csv'
const apply = process.argv.includes('--apply')
const fixedPassword = process.argv.find((a) => a.startsWith('--password='))?.slice('--password='.length)

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — run with --env-file=.env.local')
  process.exit(1)
}
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

// Keep in sync with normalizeUsername in src/pages/Login.jsx
const slug = (s) => s.normalize('NFD').toLowerCase().replace(/[^a-z0-9]/g, '')

// no 0/o, 1/l/i — the password gets read off a printed card
const PW_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'
const password = () => {
  const chunk = () => Array.from({ length: 4 }, () => PW_ALPHABET[randomInt(PW_ALPHABET.length)]).join('')
  return `${chunk()}-${chunk()}`
}

const csvCell = (v) => `"${String(v).replaceAll('"', '""')}"`

// every username already in use, so new ones never collide
async function takenUsernames() {
  const taken = new Set()
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    for (const u of data.users) {
      if (u.email?.endsWith(`@${USERNAME_DOMAIN}`)) taken.add(u.email.split('@')[0])
    }
    if (data.users.length < 1000) return taken
  }
}

const { data: households, error } = await supabase
  .from('households')
  .select('id, display_name, user_id, guests ( first_name, last_name, created_at )')
  .order('created_at')
if (error) throw error

const taken = await takenUsernames()
const rows = []
const skipped = []

for (const h of households) {
  if (h.user_id) continue
  const guests = [...h.guests].sort((a, b) => a.first_name.localeCompare(b.first_name))
  if (guests.length === 0 || guests.some((g) => !g.last_name?.trim())) {
    skipped.push(`${h.display_name}: ${guests.length ? 'a guest has no last_name' : 'no guests'}`)
    continue
  }

  const surnames = [...new Set(guests.map((g) => slug(g.last_name)).filter(Boolean))].sort()
  const base = surnames.slice(0, MAX_SURNAMES).join('')
  let username = base
  for (let n = 2; taken.has(username); n++) username = `${base}${n}`
  taken.add(username)

  rows.push({ household: h, username, password: fixedPassword ?? password(), guests: guests.map((g) => g.first_name).join(', ') })
}

rows.sort((a, b) => a.username.localeCompare(b.username))
for (const r of rows) console.log(`${r.username.padEnd(20)} ${r.household.display_name} (${r.guests})`)
for (const s of skipped) console.warn(`SKIPPED  ${s}`)

if (!apply) {
  console.log(`\nDry run: ${rows.length} login(s) would be created. Re-run with --apply to create them.`)
  process.exit(0)
}

const done = []
for (const r of rows) {
  const { data, error: createError } = await supabase.auth.admin.createUser({
    email: `${r.username}@${USERNAME_DOMAIN}`,
    password: r.password,
    email_confirm: true,
  })
  if (createError) {
    console.error(`FAILED   ${r.username}: ${createError.message}`)
    continue
  }
  const { error: linkError } = await supabase
    .from('households')
    .update({ user_id: data.user.id })
    .eq('id', r.household.id)
  if (linkError) {
    // don't leave an orphan login nobody knows the household for
    await supabase.auth.admin.deleteUser(data.user.id)
    console.error(`FAILED   ${r.username}: ${linkError.message}`)
    continue
  }
  done.push(r)
}

// append, so a later run for newly added households keeps the earlier passwords
const lines = done.map((r) => [r.household.display_name, r.guests, r.username, r.password].map(csvCell).join(','))
if (!existsSync(OUT_FILE)) lines.unshift(['household', 'guests', 'username', 'password'].map(csvCell).join(','))
if (done.length) appendFileSync(OUT_FILE, lines.join('\n') + '\n')
console.log(`\nCreated ${done.length} login(s). Usernames + passwords added to ${OUT_FILE}.`)
