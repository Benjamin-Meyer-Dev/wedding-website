// Sends a guest the wedding-website link by email, via Gmail SMTP. Invoked by
// the post-login popup (src/components/EmailLinkPrompt.jsx) through
// supabase.functions.invoke.
//
// Deploy with JWT verification ON (the default for `supabase functions
// deploy send-site-link`): the platform rejects calls that don't carry a
// signed-in guest's token, so the public anon key alone cannot use this to
// send mail.
//
// Required secrets (set with `supabase secrets set NAME=value`):
//   GMAIL_USER          the Gmail address to send from, e.g. you@gmail.com
//   GMAIL_APP_PASSWORD  a Google "App Password" (NOT the account password) —
//                       requires 2-Step Verification on the account; create at
//                       https://myaccount.google.com/apppasswords
//   SITE_URL            public address of this site, e.g. https://example.com
//   FROM_NAME           optional display name, defaults to Elizabeth & Benjamin
//
// Note: Gmail always sends from GMAIL_USER itself (a custom from-address would
// be rewritten), and caps free accounts at ~500 recipients/day — plenty here.

import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const GMAIL_USER = Deno.env.get('GMAIL_USER') ?? ''
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD') ?? ''
const SITE_URL = Deno.env.get('SITE_URL') ?? ''
const FROM_NAME = Deno.env.get('FROM_NAME') ?? 'Elizabeth & Benjamin'

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json(405, { error: 'method not allowed' })
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD || !SITE_URL) {
    return json(500, { error: 'function not configured' })
  }

  let email = ''
  let name = ''
  try {
    const body = await req.json()
    email = String(body?.email ?? '').trim().toLowerCase().slice(0, 255)
    // whitelist the greeting name hard: it lands inside our HTML
    name = String(body?.name ?? '').replace(/[^\p{L}\p{M}' -]/gu, '').trim().slice(0, 50)
  } catch {
    return json(400, { error: 'bad request' })
  }
  if (!EMAIL_RE.test(email)) return json(400, { error: 'invalid email' })
  const greeting = name ? `Hi ${name}!` : 'Hi there!'

  const client = new SMTPClient({
    connection: {
      hostname: 'smtp.gmail.com',
      port: 465,
      tls: true,
      auth: { username: GMAIL_USER, password: GMAIL_APP_PASSWORD },
    },
  })

  try {
    await client.send({
      from: `${FROM_NAME} <${GMAIL_USER}>`,
      to: email,
      subject: 'Wedding Website',
      content: `${greeting}\n\nWe're so glad you'll be celebrating with us! Here's the link to our wedding website, where you can RSVP, browse the schedule, and find everything for the big day. Log in with the username and password from your invitation!\n\n${SITE_URL}\n\nWith love,\n${FROM_NAME}`,
      html: `
        <div style="margin:0 auto;max-width:520px;padding:32px 24px;font-family:Georgia,'Times New Roman',serif;color:#15324a;">
          <h1 style="text-align:center;font-weight:400;font-size:28px;margin:0 0 18px;">${greeting}</h1>
          <p style="font-size:15px;line-height:1.6;margin:0 0 22px;text-align:center;">
            We're so glad you'll be celebrating with us! Here's the link to our
            wedding website, where you can RSVP, browse the schedule, and find
            everything for the big day. Log in with the username and password
            from your invitation!
          </p>
          <p style="text-align:center;margin:0 0 26px;">
            <a href="${SITE_URL}"
               style="display:inline-block;padding:13px 30px;border-radius:999px;background:#3a6f95;color:#ffffff;text-decoration:none;font-size:14px;letter-spacing:0.08em;outline:0;border:0;-webkit-tap-highlight-color:transparent;">
              Open the website&nbsp;&nbsp;&rarr;
            </a>
          </p>
          <p style="font-size:12px;line-height:1.6;color:#6e7f8d;text-align:center;margin:0 0 26px;">
            Or copy this address: <a href="${SITE_URL}" style="color:#3a6f95;">${SITE_URL}</a>
          </p>
          <p style="text-align:center;font-size:14px;font-style:italic;margin:0 0 6px;">With love,</p>
          <p style="text-align:center;font-size:13px;letter-spacing:0.3em;text-transform:uppercase;color:#3a6f95;margin:0;">${FROM_NAME}</p>
        </div>
      `,
    })
    await client.close()
    return json(200, { ok: true })
  } catch (err) {
    console.error('gmail smtp failed:', err)
    try { await client.close() } catch { /* already closed */ }
    return json(502, { error: 'send failed' })
  }
})
