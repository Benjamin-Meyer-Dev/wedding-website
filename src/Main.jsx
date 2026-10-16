import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import OrientationGate from './components/OrientationGate.jsx'
import { installMotionProfile } from './lib/Motion.js'
import './styles/Global.css'
import './styles/Scene.css'
import './styles/Motion.css'

// The hero photo is warmed by a <link rel="preload"> injected into index.html
// (see the preloadHero plugin in vite.config.js) rather than from here: the
// preload starts during HTML parse, whereas this module only runs once the
// bundle has downloaded and parsed.

installMotionProfile()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    {/* Sibling of <App />, not inside it: the gate has to cover the loading
        screen and the login as well as the signed-in scenes. */}
    <OrientationGate />
  </React.StrictMode>,
)
