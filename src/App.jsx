import { useEffect, useState } from 'react'
import NavBar from './components/NavBar.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Rsvp from './pages/Rsvp.jsx'
import Starfield from './components/Starfield.jsx'
import LoadingScreen from './components/LoadingScreen.jsx'
import { supabase } from './lib/supabase'
import { HouseholdProvider } from './lib/HouseholdContext.jsx'
import './styles/app.css'

export default function App() {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [introDone, setIntroDone] = useState(false)
  const [page, setPage] = useState('home')

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

  const intro = !introDone ? (
    <LoadingScreen onDone={() => setIntroDone(true)} />
  ) : null

  if (!authReady) {
    return (
      <div className="app">
        <Starfield count={150} />
        {intro}
      </div>
    )
  }

  if (!session) {
    return (
      <div className="app">
        <Starfield count={150} />
        <Login />
        {intro}
      </div>
    )
  }

  return (
    <HouseholdProvider>
      <div className="app">
        <Starfield count={150} />
        <NavBar
          page={page}
          onNavigate={setPage}
          onSignOut={() => supabase.auth.signOut()}
        />
        <div className="scrim" aria-hidden="true" />
        <main className="main">
          {page === 'home' && <Home />}
          {page === 'rsvp' && <Rsvp />}
        </main>
        {intro}
      </div>
    </HouseholdProvider>
  )
}
