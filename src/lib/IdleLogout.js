import { useEffect } from 'react'

// ---- Sign guests out once they've been away ----
// Supabase keeps the session in localStorage and refreshes it forever, so a
// guest who signed in on a shared or borrowed device stayed signed in for days.
// Instead, remember when this device last saw the guest (any interaction, or
// the moment the tab was hidden or closed) and end the session once they've
// been gone longer than AWAY_LIMIT_MS. The stamp lives in localStorage, like
// the session, so every tab shares one clock: using the site in one tab keeps
// a background tab signed in too.
export const AWAY_LIMIT_MS = 30 * 60 * 1000

// Passed to createClient so we know exactly which keys hold the session.
export const AUTH_STORAGE_KEY = 'eb-auth'

const LAST_ACTIVE_KEY = 'eb:last-active'
const WRITE_EVERY_MS = 15 * 1000
const CHECK_EVERY_MS = 60 * 1000
const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'scroll']

function readLastActive() {
  try {
    return Number(localStorage.getItem(LAST_ACTIVE_KEY)) || 0
  } catch {
    return 0 // storage blocked — treated as "never seen", same as a fresh visit
  }
}
const writeLastActive = () => { try { localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now())) } catch {} }

const isAway = () => Date.now() - readLastActive() > AWAY_LIMIT_MS

// Remove the stored session outright. Also sweeps supabase-js's default
// `sb-<ref>-auth-token` key, which held sessions before AUTH_STORAGE_KEY.
export function clearStoredAuth() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key === AUTH_STORAGE_KEY || key.startsWith(`${AUTH_STORAGE_KEY}-`) || /^sb-.+-auth-token/.test(key)) {
        localStorage.removeItem(key)
      }
    }
  } catch {}
}

// Runs once, synchronously, before the Supabase client is created: a guest
// returning after the limit gets the login screen straight away, rather than
// the app flashing in and then signing out. No stamp at all (the first load
// after this shipped) counts as away, so sessions that predate it end too.
export function dropSessionIfAway() {
  if (isAway()) clearStoredAuth()
}

// While a guest is signed in: record activity, and check on return to the tab
// (and once a minute while it's open) whether they've been away too long.
// `onAway` fires at most once per signed-in stretch.
export function useIdleLogout(signedIn, onAway) {
  useEffect(() => {
    if (!signedIn) return
    writeLastActive() // signing in (or a restored session) counts as being here

    let ended = false
    const check = () => {
      if (ended || !isAway()) return false
      ended = true
      onAway()
      return true
    }
    // Record that the guest is here. Check first: a laptop that slept with the
    // site on screen wakes to a mouse move or a hide/show before the minute
    // timer gets a chance, and that first event is a return, not activity.
    const touch = () => { if (!check()) writeLastActive() }

    let lastWrite = Date.now()
    const onActivity = () => {
      if (Date.now() - lastWrite < WRITE_EVERY_MS) return
      lastWrite = Date.now()
      touch()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') touch()
      else check()
    }

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { capture: true, passive: true }))
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pageshow', check) // back/forward cache restore
    window.addEventListener('pagehide', touch)
    const interval = setInterval(check, CHECK_EVERY_MS)

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity, { capture: true }))
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pageshow', check)
      window.removeEventListener('pagehide', touch)
      clearInterval(interval)
    }
  }, [signedIn, onAway])
}
