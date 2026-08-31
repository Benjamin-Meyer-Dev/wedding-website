import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/Global.css'
import './styles/Scene.css'

// The hero photo is warmed by a <link rel="preload"> injected into index.html
// (see the preloadHero plugin in vite.config.js) rather than from here: the
// preload starts during HTML parse, whereas this module only runs once the
// bundle has downloaded and parsed.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
