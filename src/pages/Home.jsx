import { useEffect, useState } from 'react'
import heroPhoto from '../assets/HomePage.jpg'
import './Home.css'

const WEDDING_DATE = new Date('2027-05-29T14:00:00-04:00') // Sat May 29, 2027

function diffToParts(target) {
  const now = new Date()
  let ms = Math.max(0, target.getTime() - now.getTime())
  const days = Math.floor(ms / 86400000); ms -= days * 86400000
  const hrs  = Math.floor(ms / 3600000);  ms -= hrs * 3600000
  const min  = Math.floor(ms / 60000);    ms -= min * 60000
  const sec  = Math.floor(ms / 1000)
  return { days, hrs, min, sec }
}

// The countdown owns its own state so the once-a-second tick re-renders these
// four numbers instead of the whole hero (photo, names, rules and all).
function Countdown() {
  const [t, setT] = useState(() => diffToParts(WEDDING_DATE))

  useEffect(() => {
    // Skip the tick while the tab is backgrounded — nothing is on screen to
    // update — and resync the moment it comes back.
    const tick = () => { if (!document.hidden) setT(diffToParts(WEDDING_DATE)) }
    const id = setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])

  const units = [
    { n: String(t.days), l: 'Days' },
    { n: String(t.hrs).padStart(2, '0'), l: 'Hrs' },
    { n: String(t.min).padStart(2, '0'), l: 'Min' },
    { n: String(t.sec).padStart(2, '0'), l: 'Sec' },
  ]

  return (
    <div className="home-countdown" aria-label="Time until the wedding">
      {units.map((u, i) => (
        <div className="hcd-item rev-pop" style={{ '--rd': `${980 + i * 90}ms` }} key={u.l}>
          <span className="hcd-num">{u.n}</span>
          <span className="hcd-lbl">{u.l}</span>
        </div>
      ))}
    </div>
  )
}

export default function Home() {
  return (
    <section className="scene home">
      <div className="home-stage">
        <figure className="home-figure">
          <span className="home-figure-glow" aria-hidden="true" />
          {/* The frame clips; the img pans inside it via its own transform.
              rev-fade (opacity only), NOT rev-pop: a transform-animating reveal
              would override the .home-img pan/zoom transform. */}
          <span className="home-frame">
            <img
              src={heroPhoto}
              alt="Elizabeth and Benjamin"
              className="home-img rev-fade"
              style={{ '--rd': '120ms' }}
              width="1068"
              height="1600"
              fetchpriority="high"
              decoding="async"
              draggable={false}
            />
          </span>
        </figure>

        <div className="home-copy">
          {/* home-head / home-foot are layout no-ops on desktop (display:
              contents) and become frosted backing panels on mobile, where the
              copy floats directly over the full-bleed photo. */}
          <div className="home-head">
            <h1 className="home-names">
              <span className="home-name rev-mask" style={{ '--rd': '320ms' }}>Elizabeth</span>
              <span className="home-amp">
                <span className="rev-pop" style={{ '--rd': '660ms' }}>&amp;</span>
              </span>
              <span className="home-name rev-mask" style={{ '--rd': '480ms' }}>Benjamin</span>
            </h1>

            <span className="home-rule rev-grow" style={{ '--rd': '820ms' }} />
          </div>

          <div className="home-foot">
            <p className="home-date rev" style={{ '--rd': '900ms' }}>Saturday &middot; 29 May 2027 &middot; 2:00 PM</p>

            <Countdown />
          </div>
        </div>
      </div>
    </section>
  )
}
