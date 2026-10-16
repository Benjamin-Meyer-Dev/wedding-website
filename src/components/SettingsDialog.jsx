import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Eye, EyeOff, X } from 'lucide-react'
import { supabase, verifyPassword } from '../lib/Supabase'
import { recallPassword, rememberPassword } from '../lib/RememberedPassword.js'
import './EmailPrompt.css'
import './Settings.css'

const MIN_PASSWORD = 6 // Supabase's floor; a stricter project setting surfaces as its own error

// Household settings: shows the login's username (read-only — usernames are
// assigned, see supabase/create-household-logins.sql) and changes the password.
// Shares the popup look of EmailLinkPrompt (EmailPrompt.css).
export default function SettingsDialog({ onClose }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  // filled from sign-in when this tab has it (RememberedPassword.js)
  const [current, setCurrent] = useState(recallPassword)
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)
  const [closing, setClosing] = useState(false)
  const timersRef = useRef([])
  const cardRef = useRef(null)
  const bodyRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const e = data.session?.user?.email ?? ''
      setEmail(e)
      setUsername(e.split('@')[0])
    })
  }, [])

  // same height-glide as EmailLinkPrompt when the form swaps to the done note
  useLayoutEffect(() => {
    const card = cardRef.current
    const body = bodyRef.current
    if (!card || !body) return
    const setH = () => { card.style.height = `${body.offsetHeight}px` }
    setH()
    const ro = new ResizeObserver(setH)
    ro.observe(body)
    return () => ro.disconnect()
  }, [])

  const close = () => {
    if (closing) return
    setClosing(true)
    timersRef.current.push(setTimeout(onClose, 320))
  }

  useEffect(() => () => timersRef.current.forEach(clearTimeout), [])

  const submit = async (e) => {
    e.preventDefault()
    if (!current || !next || !confirm) return setError('Please fill in all three fields.')
    if (next.length < MIN_PASSWORD) return setError(`Your new password needs at least ${MIN_PASSWORD} characters.`)
    if (next !== confirm) return setError('The new passwords don’t match.')
    if (next === current) return setError('That’s already your password.')

    setBusy(true)
    setError(null)
    // the household login is shared, so prove the current password before
    // changing it — checked on a separate client so this session is untouched
    if (!(await verifyPassword(email, current))) {
      setBusy(false)
      return setError('Your current password is incorrect.')
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: next })
    setBusy(false)
    if (updateError) return setError(updateError.message || 'Couldn’t update your password. Please try again.')
    rememberPassword(next)

    document.activeElement?.blur?.()
    setDone(true)
    timersRef.current.push(setTimeout(close, 1800))
  }

  const pwInput = (value, setValue, label, autoComplete) => (
    <label className="elp-field">
      <span>{label}</span>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        autoComplete={autoComplete}
        maxLength={128}
        onChange={(e) => { setValue(e.target.value); setError(null) }}
      />
    </label>
  )

  // portalled to <body>: the navbar that owns this is transformed, which would
  // otherwise trap the fixed overlay inside the bar
  return createPortal(
    <div
      className={`elp-overlay${closing ? ' elp-overlay--out' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      {/* closes from the X only: no outside-click or Escape, so a stray tap
          can't throw away a half-typed password */}
      <div className={`elp-card${done ? ' elp-card--sent' : ''}`} ref={cardRef}>
        <div className="elp-body" ref={bodyRef}>
          {done ? (
            <div className="elp-sent">
              <Check aria-hidden="true" />
              <p>Password updated!</p>
            </div>
          ) : (
            <>
              <button type="button" className="stg-close" onClick={close} disabled={busy} aria-label="Close settings">
                <X />
              </button>
              <h2 className="elp-title">Settings</h2>

              <div className="stg-username">
                <span>Username</span>
                {/* the row keeps its height while the session loads (CSS),
                    so the card doesn't grow mid-entrance */}
                <p>{username}</p>
              </div>

              <form className="stg-form" onSubmit={submit} noValidate>
                {/* lets password managers pair the new password with this login */}
                <input type="text" name="username" autoComplete="username" value={username} readOnly hidden />
                <div className="stg-form-head">
                  <h3>Change password</h3>
                  <button type="button" className="stg-show" onClick={() => setShow((s) => !s)}>
                    {show ? <EyeOff /> : <Eye />} {show ? 'Hide' : 'Show'}
                  </button>
                </div>
                {pwInput(current, setCurrent, 'Current password', 'current-password')}
                {pwInput(next, setNext, 'New password', 'new-password')}
                {pwInput(confirm, setConfirm, 'Confirm new password', 'new-password')}
                {error && <p className="elp-error" role="alert">{error}</p>}
                <div className="elp-actions stg-actions">
                  <button type="submit" className="elp-btn" disabled={busy}>
                    {busy ? 'Saving…' : 'Update password'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
