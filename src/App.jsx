import { useCallback, useEffect, useRef, useState } from 'react'
import NavBar from './components/NavBar.jsx'
import Home from './pages/Home.jsx'
import Story from './pages/Story.jsx'
import WeddingParty from './pages/WeddingParty.jsx'
import Login from './pages/Login.jsx'
import Rsvp from './pages/Rsvp.jsx'
import Schedule from './pages/Schedule.jsx'
import Travel from './pages/Travel.jsx'
import Faq from './pages/Faq.jsx'
import Registry from './pages/Registry.jsx'
import LoadingScreen from './components/LoadingScreen.jsx'
import BackgroundOrbs from './components/BackgroundOrbs.jsx'
import SceneDecor from './components/SceneDecor.jsx'
import { supabase } from './lib/supabase'
import { HouseholdProvider } from './lib/HouseholdContext.jsx'
import useParallax from './lib/useParallax.js'
import './styles/app.css'

const COVER_MS = 560
const REVEAL_MS = 620

export default function App() {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  // introExiting: the loader has started fading out — render the app/login
  //   BEHIND it so the loader crossfades to reveal it (smooth handoff).
  // introDone: the loader has fully faded — unmount it.
  const [introExiting, setIntroExiting] = useState(false)
  const [introDone, setIntroDone] = useState(false)
  const [page, setPage] = useState('home')

  // Curtain transition: 'idle' -> 'cover' (sweep in, swap page) -> 'reveal'.
  const [phase, setPhase] = useState('idle')
  const [pending, setPending] = useState(null)

  const appRef = useRef(null)

  // Pointer parallax: writes --px/--py onto the app root for .plx layers.
  useParallax(appRef)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      // The app stays mounted across sign-out/sign-in, so `page` would persist
      // — reset it so the next login always lands on the homepage.
      if (event === 'SIGNED_OUT') {
        setPage('home')
        setPhase('idle')
        setPending(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Drive the curtain timeline.
  useEffect(() => {
    if (phase === 'cover') {
      const t = setTimeout(() => { setPage(pending); setPhase('reveal') }, COVER_MS)
      return () => clearTimeout(t)
    }
    if (phase === 'reveal') {
      const t = setTimeout(() => { setPhase('idle'); setPending(null) }, REVEAL_MS)
      return () => clearTimeout(t)
    }
  }, [phase, pending])

  const navigate = (target) => {
    if (target === page || phase !== 'idle') return
    setPending(target)
    setPhase('cover')
  }

  // Stable callbacks so the loader's timers don't reset when introExiting flips.
  const handleIntroExit = useCallback(() => setIntroExiting(true), [])
  const handleIntroDone = useCallback(() => setIntroDone(true), [])

  // Show the app/login as soon as the loader begins exiting, so it sits beneath
  // the fading loader and is revealed by the crossfade.
  const showApp = introExiting || introDone

  const intro = !introDone ? (
    <LoadingScreen onExit={handleIntroExit} onDone={handleIntroDone} />
  ) : null

  const curtain = phase !== 'idle' ? (
    <div className={`curtain curtain--${phase}`} aria-hidden="true">
      <div className="curtain-iris" />
      <div className="curtain-mono">
        <span className="curtain-mono-row"><span>E</span><span className="amp">&amp;</span><span>B</span></span>
      </div>
    </div>
  ) : null

  if (!authReady) {
    return (
      <div className="app" ref={appRef}>
        <BackgroundOrbs />
        <SceneDecor />
        {intro}
      </div>
    )
  }

  if (!session) {
    return (
      <div className="app" ref={appRef}>
        <BackgroundOrbs />
        <SceneDecor />
        {/* Render once the loader starts fading so it crossfades to the login. */}
        {showApp && <Login />}
        {intro}
      </div>
    )
  }

  // While covering, the active tab already points at the destination.
  const activePage = phase === 'cover' ? pending : page

  return (
    <HouseholdProvider>
      <div className={`app app--page-${page}`} ref={appRef}>
        <BackgroundOrbs />
        <SceneDecor />
        {/* Render once the loader starts fading so it crossfades to the page. */}
        {showApp && (
          <>
            <NavBar
              page={activePage}
              onNavigate={navigate}
              onSignOut={() => supabase.auth.signOut()}
            />
            <main className="main">
              {page === 'home' && <Home />}
              {page === 'story' && <Story />}
              {page === 'party' && <WeddingParty />}
              {page === 'schedule' && <Schedule />}
              {page === 'travel' && <Travel />}
              {page === 'faq' && <Faq />}
              {page === 'registry' && <Registry />}
              {page === 'rsvp' && <Rsvp />}
            </main>
          </>
        )}
        {curtain}
        {intro}
      </div>
    </HouseholdProvider>
  )
}
