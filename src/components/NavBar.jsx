import { useEffect, useRef, useState } from 'react'
import './navbar.css'

const Icon = ({ children, label, page, currentPage, onSelect }) => {
  const isActive = page && page === currentPage
  const isNav = Boolean(page && onSelect)
  return (
    <button
      type="button"
      className={`nav-btn${isActive ? ' is-active' : ''}`}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      onClick={isNav ? () => onSelect(page) : undefined}
    >
      <span className="ico">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
             strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          {children}
        </svg>
      </span>
      <span className="lbl">{label}</span>
    </button>
  )
}

export default function NavBar({ page, onNavigate, onSignOut }) {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(max-width: 960px)')
    const onChange = (e) => { if (e.matches) setOpen(false) }
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }
  const isHoverDevice = () =>
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    window.matchMedia('(min-width: 961px)').matches

  const handleEnter = () => {
    if (!isHoverDevice()) return
    cancelClose()
    setOpen(true)
  }
  const handleLeave = () => {
    if (!isHoverDevice()) return
    closeTimer.current = setTimeout(() => setOpen(false), 180)
  }
  const toggleMenu = () => {
    cancelClose()
    setOpen(o => !o)
  }

  return (
    <aside
      className={`navbar${open ? ' is-open' : ''}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
    >
      <div className="navbar-top">
        <div className="monogram" aria-label="E and B">
          <span>E</span>
          <span className="amp">&amp;</span>
          <span>B</span>
        </div>
        <button
          type="button"
          className="hamburger"
          onClick={toggleMenu}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          <span /><span /><span />
        </button>
      </div>

      <div className="menu-panel">
        <nav className="nav">
        <Icon label="Home" page="home" currentPage={page} onSelect={onNavigate}>
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5 10v10h14V10" />
        </Icon>
        <Icon label="Our Story">
          <path d="M20.8 5.6a4.5 4.5 0 0 0-7.6-2 5.2 5.2 0 0 0-1.2 1.6 5.2 5.2 0 0 0-1.2-1.6 4.5 4.5 0 0 0-7.6 2C2.4 9.6 6.5 13 12 19c5.5-6 9.6-9.4 8.8-13.4Z" />
        </Icon>
        <Icon label="Wedding Party">
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="9.5" r="2.3" />
          <path d="M3 19c.6-3 3.2-4.5 6-4.5s5.4 1.5 6 4.5" />
          <path d="M15 19c.4-2 2-3 4-3" />
        </Icon>
        <Icon label="Schedule">
          <rect x="3.5" y="5" width="17" height="15" rx="1.5" />
          <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
        </Icon>
        <Icon label="Travel & Stay">
          <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
          <circle cx="12" cy="9.5" r="2.5" />
        </Icon>
        <Icon label="Registry">
          <rect x="3.5" y="8" width="17" height="12" rx="1" />
          <path d="M3.5 12h17M12 8v12M8 8c0-2 1.5-3.5 4-3.5s4 1.5 4 3.5" />
        </Icon>
        <Icon label="FAQ">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.6-2.5 1.9-2.5 3.5" />
          <circle cx="12" cy="16.5" r=".6" fill="currentColor" stroke="none" />
        </Icon>
        <Icon label="RSVP" page="rsvp" currentPage={page} onSelect={onNavigate}>
          <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
          <path d="m3.5 6.5 8.5 6.5L20.5 6.5" />
        </Icon>
      </nav>

      <div className="footer">
        {onSignOut && (
          <button
            type="button"
            className="signout-btn"
            onClick={onSignOut}
            aria-label="Sign out"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
                 strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
              <path d="M10 17l-5-5 5-5" />
              <path d="M15 12H5" />
            </svg>
            <span className="signout-lbl">Sign Out</span>
          </button>
        )}

      </div>
      </div>
    </aside>
  )
}
