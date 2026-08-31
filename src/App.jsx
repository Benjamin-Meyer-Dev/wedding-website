import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import NavBar from './components/NavBar.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import LoadingScreen from './components/LoadingScreen.jsx'
import EmailLinkPrompt from './components/EmailLinkPrompt.jsx'
import BackgroundOrbs from './components/BackgroundOrbs.jsx'
import SceneDecor from './components/SceneDecor.jsx'
import { supabase } from './lib/Supabase'
import { HouseholdProvider } from './lib/HouseholdContext.jsx'
import './styles/App.css'

// Everything past the first screen loads as its own chunk. The login and the
// homepage are what a guest actually waits for, so they stay in the initial
// bundle; the rest is fetched in the background once the intro has played (see
// the prefetch effect below), and in the worst case a navigation has the
// curtain's 560ms cover to finish the fetch behind.
const LOADERS = {
  story: () => import('./pages/Story.jsx'),
  party: () => import('./pages/WeddingParty.jsx'),
  schedule: () => import('./pages/Schedule.jsx'),
  travel: () => import('./pages/Travel.jsx'),
  faq: () => import('./pages/Faq.jsx'),
  registry: () => import('./pages/Registry.jsx'),
  rsvp: () => import('./pages/Rsvp.jsx'),
}
const PAGES = Object.fromEntries(
  Object.entries(LOADERS).map(([name, load]) => [name, lazy(load)]),
)

const COVER_MS = 560
const REVEAL_MS = 620
// Sentinel `pending` target: the curtain is covering the LOGIN, and at the
// midpoint it swaps the auth gate to the app instead of switching pages.
const ENTER_APP = '__enter-app__'

function LazyPage({ name }) {
  const Page = PAGES[name]
  return Page ? <Page /> : null
}

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

  // The auth listener is registered once; read the live gate through a ref.
  const gateRef = useRef(gate)
  useEffect(() => { gateRef.current = gate }, [gate])
  // False until getSession() has reported the initial auth state. auth-js
  // recovers a stored session during initialize() and announces it as
  // SIGNED_IN — indistinguishable from a real sign-in, and it lands BEFORE
  // getSession() resolves. Without this flag every refresh looked like a fresh
  // sign-in and swept the curtain across the loading screen.
  const authSettledRef = useRef(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const initialGate = data.session ? 'app' : 'login'
      setSession(data.session)
      // Both refs are written synchronously: the auth listener can fire before
      // the effect that mirrors `gate` into gateRef has had a chance to run.
      gateRef.current = initialGate
      authSettledRef.current = true
      setGate(initialGate)
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
        gateRef.current = 'login'
        setGate('login')
      }
      // Fresh sign-in from the login gate: instead of an instant tree swap,
      // sweep the curtain over the login; the cover-end handler flips the
      // gate to the app underneath it, then the curtain reveals the homepage.
      // (gateRef guards against SIGNED_IN re-fires while already in the app;
      // authSettledRef against the restore-a-stored-session SIGNED_IN that
      // arrives on every page load before the initial gate is known.)
      if (event === 'SIGNED_IN' && authSettledRef.current && gateRef.current === 'login') {
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
    // Ask for the chunk at click time as well as on idle: on a cold cache the
    // curtain's 560ms cover then doubles as the loading window.
    if (LOADERS[target]) LOADERS[target]().catch(() => {})
    setPending(target)
    setPhase('cover')
  }

  // Stable callbacks so the loader's timers don't reset when introExiting flips.
  const handleIntroExit = useCallback(() => setIntroExiting(true), [])
  const handleIntroDone = useCallback(() => setIntroDone(true), [])

  // Warm every page chunk once the guest is in and the entrance has settled, so
  // navigation never actually waits on a network round trip. Idle-scheduled and
  // one at a time: the fetches must not compete with the page that is on screen.
  useEffect(() => {
    if (gate !== 'app' || !introExiting) return
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 300))
    const cancelIdle = window.cancelIdleCallback || clearTimeout
    const loaders = Object.values(LOADERS)
    let handle = null
    let cancelled = false
    let i = 0
    const next = () => {
      if (cancelled || i >= loaders.length) return
      Promise.resolve(loaders[i++]()).catch(() => {}).then(() => {
        if (!cancelled) handle = idle(next)
      })
    }
    handle = idle(next)
    return () => { cancelled = true; if (handle != null) cancelIdle(handle) }
  }, [gate, introExiting])

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
      <div className="app">
        <BackgroundOrbs />
        <SceneDecor />
        {intro}
      </div>
    )
  }

  if (gate === 'login') {
    return (
      <div className="app">
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
      <div className={`app app--page-${page}`}>
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
              {/* No fallback UI: a chunk that isn't ready yet simply leaves the
                  scene empty for a frame or two behind the curtain, which is
                  quieter than a spinner flashing in and out. */}
              <Suspense fallback={null}>
                {page === 'home' ? <Home /> : <LazyPage name={page} />}
              </Suspense>
            </main>
            {/* one-time "email me the site link" offer; renders nothing once answered */}
            <EmailLinkPrompt />
          </>
        )}
        {curtain}
        {intro}
      </div>
    </HouseholdProvider>
  )
}
