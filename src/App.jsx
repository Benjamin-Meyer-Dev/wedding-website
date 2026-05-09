import { useEffect, useState } from 'react'
import NavBar from './components/NavBar.jsx'
import Home from './pages/Home.jsx'
import Starfield from './components/Starfield.jsx'
import './styles/app.css'

export default function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark'
    return localStorage.getItem('eb-theme') || 'dark'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('eb-theme', theme)
  }, [theme])

  return (
    <div className="app">
      <Starfield count={150} />
      <NavBar theme={theme} onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} />
      <div className="scrim" aria-hidden="true" />
      <main className="main">
        <Home />
      </main>
    </div>
  )
}
