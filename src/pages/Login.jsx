import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
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
    const cleanUsername = username.trim().toLowerCase().slice(0, 64)
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
    <section className="scene login">
      <figure className="login-figure plx" style={{ '--d': '24px' }}>
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

          {error && <p className="login-error" role="alert">{error}</p>}

          <button type="submit" className="login-btn rev" style={{ '--rd': '800ms' }} disabled={loading}>
            {loading ? 'Signing In…' : 'Enter'}
          </button>
        </form>
      </article>
    </section>
  )
}
