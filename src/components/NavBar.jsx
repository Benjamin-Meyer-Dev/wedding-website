import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  Home as IconHome,
  BookHeart as IconStory,
  Users as IconParty,
  CalendarDays as IconSchedule,
  Map as IconTravel,
  MessageCircleQuestion as IconFaq,
  Gift as IconRegistry,
  Mail as IconRsvp,
  LogOut as IconSignOut,
} from 'lucide-react'
import './navbar.css'

// Shown centered in the bar on mobile (where the full nav collapses to a burger)
// so the guest always sees which page they're on.
const PAGE_LABELS = {
  home: 'Home',
  story: 'Our Story',
  party: 'Wedding Party',
  schedule: 'Schedule',
  travel: 'Travel',
  faq: 'FAQ',
  registry: 'Registry',
  rsvp: 'RSVP',
}

export default function NavBar({ page, onNavigate, onSignOut }) {
  const [open, setOpen] = useState(false)
  const [resizing, setResizing] = useState(false)
  const headerRef = useRef(null)

  // Publish the navbar's live height so pages can offset their content to sit a
  // fixed 15px below it (consumed as --content-top in global.css). Re-measures
  // on resize and after the display font loads — both change the bar's height.
  useLayoutEffect(() => {
    const el = headerRef.current
    if (!el || typeof window === 'undefined') return
    const setH = () =>
      document.documentElement.style.setProperty('--topbar-h', `${Math.round(el.offsetHeight)}px`)
    setH()
    const ro = new ResizeObserver(setH)
    ro.observe(el)
    document.fonts?.ready?.then(setH)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(min-width: 861px)')
    const onChange = (e) => { if (e.matches) setOpen(false) }
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  // Flag the bar as resizing so its breakpoint-dependent styles (the delayed
  // corner swap) apply instantly. setResizing(true) is idempotent — React bails
  // on repeat calls — so a resize burst is just two renders (on, then off).
  useEffect(() => {
    if (typeof window === 'undefined') return
    let t
    const onResize = () => {
      setResizing(true)
      clearTimeout(t)
      t = setTimeout(() => setResizing(false), 200)
    }
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); clearTimeout(t) }
  }, [])

  const handleNavigate = (target) => {
    setOpen(false)
    onNavigate?.(target)
  }

  return (
    <header className={`topbar${open ? ' is-open' : ''}${resizing ? ' is-resizing' : ''}`} ref={headerRef}>
      <div className="topbar-inner">
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

        <span className="topbar-current" aria-hidden="true">{PAGE_LABELS[page] ?? ''}</span>

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
            className={`topbar-link${page === 'story' ? ' is-active' : ''}`}
            onClick={() => handleNavigate('story')}
          >
            Our Story
          </button>
          <button
            type="button"
            className={`topbar-link${page === 'party' ? ' is-active' : ''}`}
            onClick={() => handleNavigate('party')}
          >
            Wedding Party
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
            className={`topbar-link${page === 'travel' ? ' is-active' : ''}`}
            onClick={() => handleNavigate('travel')}
          >
            Travel
          </button>
          <button
            type="button"
            className={`topbar-link${page === 'faq' ? ' is-active' : ''}`}
            onClick={() => handleNavigate('faq')}
          >
            FAQ
          </button>
          <button
            type="button"
            className={`topbar-link${page === 'registry' ? ' is-active' : ''}`}
            onClick={() => handleNavigate('registry')}
          >
            Registry
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
              <IconSignOut />
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
              className={`topbar-drawer-link${page === 'story' ? ' is-active' : ''}`}
              onClick={() => handleNavigate('story')}
            >
              <span className="topbar-drawer-link-icon"><IconStory /></span>
              <span className="topbar-drawer-link-lbl">Our Story</span>
            </button>
            <button
              type="button"
              className={`topbar-drawer-link${page === 'party' ? ' is-active' : ''}`}
              onClick={() => handleNavigate('party')}
            >
              <span className="topbar-drawer-link-icon"><IconParty /></span>
              <span className="topbar-drawer-link-lbl">Wedding Party</span>
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
              className={`topbar-drawer-link${page === 'travel' ? ' is-active' : ''}`}
              onClick={() => handleNavigate('travel')}
            >
              <span className="topbar-drawer-link-icon"><IconTravel /></span>
              <span className="topbar-drawer-link-lbl">Travel</span>
            </button>
            <button
              type="button"
              className={`topbar-drawer-link${page === 'faq' ? ' is-active' : ''}`}
              onClick={() => handleNavigate('faq')}
            >
              <span className="topbar-drawer-link-icon"><IconFaq /></span>
              <span className="topbar-drawer-link-lbl">FAQ</span>
            </button>
            <button
              type="button"
              className={`topbar-drawer-link${page === 'registry' ? ' is-active' : ''}`}
              onClick={() => handleNavigate('registry')}
            >
              <span className="topbar-drawer-link-icon"><IconRegistry /></span>
              <span className="topbar-drawer-link-lbl">Registry</span>
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
