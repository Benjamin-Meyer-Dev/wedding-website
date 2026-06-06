import { useEffect, useRef, useState } from 'react'
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
import './styles/app.css'

const COVER_MS = 560
const REVEAL_MS = 620
const reduceMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function App() {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [introDone, setIntroDone] = useState(false)
  const [page, setPage] = useState('home')

  // Curtain transition: 'idle' -> 'cover' (sweep in, swap page) -> 'reveal'.
  const [phase, setPhase] = useState('idle')
  const [pending, setPending] = useState(null)

  const appRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
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
    if (reduceMotion()) { setPage(target); return }
    setPending(target)
    setPhase('cover')
  }

  const intro = !introDone ? (
    <LoadingScreen onDone={() => setIntroDone(true)} />
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
        {intro}
      </div>
    )
  }

  if (!session) {
    return (
      <div className="app" ref={appRef}>
        <BackgroundOrbs />
        <SceneDecor />
        <Login />
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
        {curtain}
        {intro}
      </div>
    </HouseholdProvider>
  )
}
