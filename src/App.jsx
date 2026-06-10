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
// Sentinel `pending` target: the curtain is covering the LOGIN, and at the
// midpoint it swaps the auth gate to the app instead of switching pages.
const ENTER_APP = '__enter-app__'

export default function App() {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  // introExiting: the loader has started fading out — render the app/login
  //   BEHIND it so the loader crossfades to reveal it (smooth handoff).
  // introDone: the loader has fully faded — unmount it.
  const [introExiting, setIntroExiting] = useState(false)
  const [introDone, setIntroDone] = useState(false)
  const [page, setPage] = useState('home')
  // What the auth gate shows. Deliberately lags `session` on sign-in so the
  // curtain can sweep over the login BEFORE the app swaps in beneath it.
  const [gate, setGate] = useState('login')

  // Curtain transition: 'idle' -> 'cover' (sweep in, swap page) -> 'reveal'.
  const [phase, setPhase] = useState('idle')
  const [pending, setPending] = useState(null)

  const appRef = useRef(null)
  // The auth listener is registered once; read the live gate through a ref.
  const gateRef = useRef(gate)
  useEffect(() => { gateRef.current = gate }, [gate])

  // Pointer parallax: writes --px/--py onto the app root for .plx layers.
  useParallax(appRef)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setGate(data.session ? 'app' : 'login')
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
        setGate('login')
      }
      // Fresh sign-in from the login gate: instead of an instant tree swap,
      // sweep the curtain over the login; the cover-end handler flips the
      // gate to the app underneath it, then the curtain reveals the homepage.
      // (gateRef guards against SIGNED_IN re-fires while already in the app.)
      if (event === 'SIGNED_IN' && gateRef.current === 'login') {
        setPending(ENTER_APP)
        setPhase('cover')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Drive the curtain timeline.
  useEffect(() => {
    if (phase === 'cover') {
      const t = setTimeout(() => {
        if (pending === ENTER_APP) setGate('app')
        else setPage(pending)
        setPhase('reveal')
      }, COVER_MS)
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

  if (gate === 'login') {
    return (
      <div className="app" ref={appRef}>
        <BackgroundOrbs />
        <SceneDecor />
        {/* Render once the loader starts fading so it crossfades to the login. */}
        {showApp && <Login />}
        {/* The sign-in curtain covers the login here; after the gate flips,
            the app tree below picks it up mid-transition for the reveal. */}
        {curtain}
        {intro}
      </div>
    )
  }

  return (
    <HouseholdProvider>
      <div className={`app app--page-${page}`} ref={appRef}>
        <BackgroundOrbs />
        <SceneDecor />
        {/* Render once the loader starts fading so it crossfades to the page. */}
        {showApp && (
          <>
            <NavBar
              page={page}
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
