import { useEffect, useState } from 'react'
import './navbar.css'

const IconHome = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5 10.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9.5" />
  </svg>
)

const IconSchedule = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M3.5 9.5h17" />
    <path d="M8 3.5v3M16 3.5v3" />
    <path d="M8 13h2M8 16.5h2M13 13h3M13 16.5h3" />
  </svg>
)

const IconRsvp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="m3.5 7 8.5 6.5L20.5 7" />
  </svg>
)

const IconSignOut = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
    <path d="M10 17l-5-5 5-5" />
    <path d="M15 12H5" />
  </svg>
)

export default function NavBar({ page, onNavigate, onSignOut }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(min-width: 861px)')
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
            className={`topbar-link${page === 'schedule' ? ' is-active' : ''}`}
            onClick={() => handleNavigate('schedule')}
          >
            Schedule
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

      <div className="topbar-drawer" role="menu">
        <div className="topbar-drawer-track">
          <div className="topbar-drawer-inner">
            <button
              type="button"
              className={`topbar-drawer-link${page === 'home' ? ' is-active' : ''}`}
              onClick={() => handleNavigate('home')}
            >
              <span className="topbar-drawer-link-icon"><IconHome /></span>
              <span className="topbar-drawer-link-lbl">Home</span>
            </button>
            <button
              type="button"
              className={`topbar-drawer-link${page === 'schedule' ? ' is-active' : ''}`}
              onClick={() => handleNavigate('schedule')}
            >
              <span className="topbar-drawer-link-icon"><IconSchedule /></span>
              <span className="topbar-drawer-link-lbl">Schedule</span>
            </button>
            <button
              type="button"
              className={`topbar-drawer-link${page === 'rsvp' ? ' is-active' : ''}`}
              onClick={() => handleNavigate('rsvp')}
            >
              <span className="topbar-drawer-link-icon"><IconRsvp /></span>
              <span className="topbar-drawer-link-lbl">RSVP</span>
            </button>
            {onSignOut && (
              <button
                type="button"
                className="topbar-drawer-link is-signout"
                onClick={() => { setOpen(false); onSignOut() }}
              >
                <span className="topbar-drawer-link-icon"><IconSignOut /></span>
                <span className="topbar-drawer-link-lbl">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
