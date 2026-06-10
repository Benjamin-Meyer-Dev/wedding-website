import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import heroPhoto from './assets/HomePage.jpg'
import './styles/global.css'
import './styles/scene.css'

// Warm the hero photo (login + home) while the loading screen plays, so the
// crossfade to the page doesn't stall on a ~700KB image decode mid-animation.
const heroWarm = new Image()
heroWarm.src = heroPhoto
if (heroWarm.decode) heroWarm.decode().catch(() => {})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
