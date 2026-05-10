import { useEffect, useState } from 'react'
import NavBar from './components/NavBar.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Starfield from './components/Starfield.jsx'
import { supabase } from './lib/supabase'
import './styles/app.css'

export default function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    return localStorage.getItem('eb-theme') || 'light'
  })

  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('eb-theme', theme)
  }, [theme])

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

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  if (!authReady) {
    return (
      <div className="app">
        <Starfield count={150} />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="app">
        <Starfield count={150} />
        <NavBar minimal theme={theme} onToggleTheme={toggleTheme} />
        <div className="scrim" aria-hidden="true" />
        <Login />
      </div>
    )
  }

  return (
    <div className="app">
      <Starfield count={150} />
      <NavBar
        onSignOut={() => supabase.auth.signOut()}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <div className="scrim" aria-hidden="true" />
      <main className="main">
        <Home />
      </main>
    </div>
  )
}
