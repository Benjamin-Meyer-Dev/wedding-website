import { useState } from 'react'
import heroPhoto from '../assets/HomePage.jpg'
import { supabase } from '../lib/supabase'
import './login.css'

const USERNAME_DOMAIN = 'wedding.local'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [pwAnimating, setPwAnimating] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const togglePassword = () => {
    setPwAnimating(true)
    setTimeout(() => setShowPassword(s => !s), 110)
    setTimeout(() => setPwAnimating(false), 220)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const cleanUsername = username.trim().toLowerCase()
    if (!cleanUsername || !password) {
      setError('Please enter your username and password.')
      return
    }
    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: `${cleanUsername}@${USERNAME_DOMAIN}`,
      password,
    })
    setLoading(false)
    if (authError) {
      setError('Invalid username or password.')
    }
  }

  return (
    <section className="login">
      <figure className="login-figure">
        <img
          src={heroPhoto}
          alt="Elizabeth and Benjamin"
          className="login-img"
          width="1068"
          height="1600"
        />
      </figure>

      <article className="login-card glass">
        <header className="login-card-head">
          <p className="login-tag">Save the Date</p>
          <h1 className="login-mono">
            <span>E</span>
            <span className="amp">&amp;</span>
            <span>B</span>
          </h1>
          <p className="login-date">29 May 2027</p>
        </header>

        <div className="login-rule" />

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span className="field-lbl">Username</span>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              spellCheck="false"
              autoCapitalize="off"
              required
            />
          </label>

          <label className="field">
            <span className="field-lbl">Password</span>
            <div className="field-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={pwAnimating ? 'is-toggling' : ''}
                required
              />
              <button
                type="button"
                className={`field-toggle${showPassword ? ' is-shown' : ''}${password ? ' is-visible' : ''}`}
                onClick={togglePassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                <svg className="icon-eye" viewBox="0 0 24 24" width="20" height="20"
                     fill="none" stroke="currentColor" strokeWidth="1.6"
                     strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <svg className="icon-eye-off" viewBox="0 0 24 24" width="20" height="20"
                     fill="none" stroke="currentColor" strokeWidth="1.6"
                     strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3l18 18" />
                  <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                  <path d="M9.9 5.1A10.7 10.7 0 0 1 12 5c5 0 9.3 3.1 11 7-.4 1-1 2-1.7 2.8M6.6 6.6C4.4 8 2.7 9.9 2 12c1.7 3.9 6 7 11 7 1.9 0 3.6-.4 5.2-1.2" />
                </svg>
              </button>
            </div>
          </label>

          {error && <p className="login-error" role="alert">{error}</p>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing In…' : 'Enter'}
          </button>
        </form>
      </article>
    </section>
  )
}
