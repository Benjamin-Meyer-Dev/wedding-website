import { useEffect, useState } from 'react'
import { Eye, EyeOff, CircleAlert } from 'lucide-react'
import heroPhoto from '../assets/HomePage.jpg'
import { supabase } from '../lib/supabase'
import './login.css'

const USERNAME_DOMAIN = 'wedding.local'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [pwAnimating, setPwAnimating] = useState(false)
  // Errors surface as a toast pill at the top of the screen (no inline text).
  // `id` keys the element so back-to-back failures replay the drop-in.
  const [alert, setAlert] = useState(null) // { id, text, leaving }
  const [loading, setLoading] = useState(false)

  const showAlert = (text) => setAlert({ id: Date.now(), text, leaving: false })

  // Auto-dismiss: hold ~4s, play the slide-out, then unmount.
  useEffect(() => {
    if (!alert) return
    const t = alert.leaving
      ? setTimeout(() => setAlert(null), 300)
      : setTimeout(() => setAlert((a) => (a && a.id === alert.id ? { ...a, leaving: true } : a)), 3900)
    return () => clearTimeout(t)
  }, [alert])

  const togglePassword = () => {
    setPwAnimating(true)
    setTimeout(() => setShowPassword(s => !s), 110)
    setTimeout(() => setPwAnimating(false), 220)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setAlert(null)
    const cleanUsername = username.trim().toLowerCase().slice(0, 64)
    if (!cleanUsername || !password) {
      showAlert('Please enter your username and password.')
      return
    }
    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: `${cleanUsername}@${USERNAME_DOMAIN}`,
      password,
    })
    setLoading(false)
    if (authError) {
      showAlert('Invalid username or password.')
    }
  }

  return (
    <section className="scene login">
      {alert && (
        <div
          key={alert.id}
          className={`login-alert${alert.leaving ? ' login-alert--out' : ''}`}
          role="alert"
        >
          <CircleAlert aria-hidden="true" />
          <span>{alert.text}</span>
        </div>
      )}
      {/* plx with the same depth as the homepage figure: the pointer parallax
          offset matches at the moment of the sign-in transition. */}
      <figure className="login-figure plx" style={{ '--d': '16px' }}>
        <span className="login-frame">
          <img
            src={heroPhoto}
            alt="Elizabeth and Benjamin"
            className="login-img"
            width="1068"
            height="1600"
            decoding="async"
            draggable={false}
          />
        </span>
      </figure>

      <article className="login-card glass">
        <header className="login-card-head">
          <p className="login-tag rev-fall" style={{ '--rd': '220ms' }}>Save the Date</p>
          <h1 className="login-mono rev-pop" style={{ '--rd': '320ms' }}>
            <span>E</span>
            <span className="amp">&amp;</span>
            <span>B</span>
          </h1>
          <p className="login-date rev" style={{ '--rd': '460ms' }}>29 May 2027</p>
        </header>

        <div className="login-rule rev-grow" style={{ '--rd': '560ms' }} />

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <label className="field rev" style={{ '--rd': '620ms' }}>
            <span className="field-lbl">Username</span>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              spellCheck="false"
              autoCapitalize="off"
              maxLength={64}
              required
            />
          </label>

          <label className="field rev" style={{ '--rd': '700ms' }}>
            <span className="field-lbl">Password</span>
            <div className="field-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={pwAnimating ? 'is-toggling' : ''}
                maxLength={128}
                required
              />
              <button
                type="button"
                className={`field-toggle${showPassword ? ' is-shown' : ''}${password ? ' is-visible' : ''}`}
                onClick={togglePassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                <Eye className="icon-eye" />
                <EyeOff className="icon-eye-off" />
              </button>
            </div>
          </label>

          <button type="submit" className="login-btn rev" style={{ '--rd': '800ms' }} disabled={loading}>
            {loading ? 'Signing In…' : 'Enter'}
          </button>
        </form>
      </article>
    </section>
  )
}
