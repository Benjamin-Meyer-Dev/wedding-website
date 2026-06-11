import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Mail, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useHousehold } from '../lib/HouseholdContext.jsx'
import './emailprompt.css'

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/

// One-time post-login popup: offers to email the guest a link to this site.
// "Asked" is tracked per member via household_members.email_prompted_at
// (migration 0006) — written when they send OR decline, so the popup never
// returns. There is deliberately no dismiss-without-answering: the two
// buttons are the only exits, so every guest is asked exactly once.
export default function EmailLinkPrompt() {
  const { member } = useHousehold()
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null) // 'invalid' | 'send'
  const timersRef = useRef([])
  const cardRef = useRef(null)
  const bodyRef = useRef(null)
  const inputRef = useRef(null)

  // Pin the card to its content's pixel height so the swap to the short
  // "Sent!" note shrinks smoothly (height:auto can't animate; the CSS
  // transition on .elp-card does the gliding).
  useLayoutEffect(() => {
    if (!open) return
    const card = cardRef.current
    const body = bodyRef.current
    if (!card || !body) return
    const setH = () => { card.style.height = `${body.offsetHeight}px` }
    setH()
    const ro = new ResizeObserver(setH)
    ro.observe(body)
    return () => ro.disconnect()
  }, [open])

  // play the fade-out, then unmount once it has finished
  const close = () => {
    setClosing(true)
    timersRef.current.push(setTimeout(() => setOpen(false), 320))
  }

  useEffect(() => () => timersRef.current.forEach(clearTimeout), [])

  useEffect(() => {
    if (!member) return
    let cancelled = false
    supabase
      .from('household_members')
      .select('email_prompted_at')
      .eq('user_id', member.user_id)
      .maybeSingle()
      .then(({ data, error: qError }) => {
        if (cancelled || qError || !data || data.email_prompted_at) return
        // open immediately: the popup (z 60) mounts UNDER the sign-in curtain
        // (z 70), so it's already in place the moment the curtain reveals —
        // the guest sees it before they can click anything else
        setOpen(true)
      })
    return () => { cancelled = true }
  }, [member])

  const stampPrompted = (fields) =>
    supabase
      .from('household_members')
      .update({ ...fields, email_prompted_at: new Date().toISOString() })
      .eq('user_id', member.user_id)

  const decline = async () => {
    inputRef.current?.blur()
    close()
    await stampPrompted({})
  }

  const send = async () => {
    const clean = email.trim().toLowerCase()
    if (!EMAIL_RE.test(clean)) {
      setError('invalid')
      return
    }
    setBusy(true)
    setError(null)
    const { error: fnError } = await supabase.functions.invoke('send-site-link', {
      body: { email: clean, name: member.first_name },
    })
    if (fnError) {
      setBusy(false)
      setError('send')
      return
    }
    await stampPrompted({ email: clean })
    setBusy(false)
    // drop focus before the input unmounts: password managers (Bitwarden etc.)
    // anchor their overlay to the focused field and leave it stranded over the
    // shrinking card otherwise
    inputRef.current?.blur()
    setSent(true)
    // let the "Sent!" note land, then fade the whole popup away
    timersRef.current.push(setTimeout(close, 2000))
  }

  if (!open || !member) return null

  return (
    <div className={`elp-overlay${closing ? ' elp-overlay--out' : ''}`} role="dialog" aria-modal="true" aria-label="Email me the website link">
      <div className={`elp-card${sent ? ' elp-card--sent' : ''}`} ref={cardRef}>
        <div className="elp-body" ref={bodyRef}>
          {sent ? (
            <div className="elp-sent">
              <Mail aria-hidden="true" />
              <p>Sent! Check your inbox.</p>
            </div>
          ) : (
            <>
              <h2 className="elp-title">Keep our website handy!</h2>
              <p className="elp-text">
                Hi {member.first_name}! Enter your email and we'll send you a link
                to our website, so it's easy to find whenever you need it. No spam,
                just the one email.
              </p>
              <label className="elp-field">
                <span>Email address</span>
                <input
                  ref={inputRef}
                  type="email"
                  value={email}
                  placeholder="you@example.com"
                  autoComplete="email"
                  maxLength={255}
                  data-bwignore="true"
                  data-1p-ignore="true"
                  data-lpignore="true"
                  onChange={(e) => { setEmail(e.target.value); setError(null) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') send() }}
                />
              </label>
              {error && (
                <p className="elp-error">
                  {error === 'invalid'
                    ? 'That doesn’t look like an email address.'
                    : 'Failed to send, please try again.'}
                </p>
              )}
              <div className="elp-actions">
                <button type="button" className="elp-btn elp-btn--ghost" onClick={decline} disabled={busy}>
                  <X /> No thanks
                </button>
                <button type="button" className="elp-btn" onClick={send} disabled={busy}>
                  <Mail /> {busy ? 'Sending…' : 'Email me the link'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
