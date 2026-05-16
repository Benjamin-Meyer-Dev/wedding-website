import { useEffect, useState } from 'react'
import './navbar.css'

export default function NavBar({ page, onNavigate, onSignOut }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(min-width: 720px)')
    const onChange = (e) => { if (e.matches) setOpen(false) }
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  const handleNavigate = (target) => {
    setOpen(false)
    onNavigate?.(target)
  }

  return (
    <header className={`topbar${open ? ' is-open' : ''}`}>
      <div className="topbar-inner glass">
        <button
          type="button"
          className="topbar-monogram"
          onClick={() => handleNavigate('home')}
          aria-label="Home"
        >
          <span>E</span>
          <span className="amp">&amp;</span>
          <span>B</span>
        </button>

        <nav className="topbar-nav">
          <button
            type="button"
            className={`topbar-link${page === 'home' ? ' is-active' : ''}`}
            onClick={() => handleNavigate('home')}
          >
            Home
          </button>
          <button
            type="button"
            className={`topbar-link${page === 'rsvp' ? ' is-active' : ''}`}
            onClick={() => handleNavigate('rsvp')}
          >
            RSVP
          </button>
        </nav>

        <div className="topbar-right">
          {onSignOut && (
            <button
              type="button"
              className="topbar-signout"
              onClick={onSignOut}
              aria-label="Sign out"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
                   strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
                <path d="M10 17l-5-5 5-5" />
                <path d="M15 12H5" />
              </svg>
              <span className="topbar-signout-lbl">Sign Out</span>
            </button>
          )}
          <button
            type="button"
            className="topbar-burger"
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      <div className="topbar-drawer glass" role="menu">
        <button
          type="button"
          className={`topbar-drawer-link${page === 'home' ? ' is-active' : ''}`}
          onClick={() => handleNavigate('home')}
        >
          Home
        </button>
        <button
          type="button"
          className={`topbar-drawer-link${page === 'rsvp' ? ' is-active' : ''}`}
          onClick={() => handleNavigate('rsvp')}
        >
          RSVP
        </button>
        {onSignOut && (
          <button
            type="button"
            className="topbar-drawer-link is-signout"
            onClick={() => { setOpen(false); onSignOut() }}
          >
            Sign Out
          </button>
        )}
      </div>
    </header>
  )
}
