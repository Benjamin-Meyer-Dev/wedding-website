import { useEffect, useState } from 'react'
import heroPhoto from '../assets/HomePage.jpg'
import './home.css'

const WEDDING_DATE = new Date('2027-05-29T16:00:00-04:00') // Sat May 29, 2027

function diffToParts(target) {
  const now = new Date()
  let ms = Math.max(0, target.getTime() - now.getTime())
  const days = Math.floor(ms / 86400000); ms -= days * 86400000
  const hrs  = Math.floor(ms / 3600000);  ms -= hrs * 3600000
  const min  = Math.floor(ms / 60000);    ms -= min * 60000
  const sec  = Math.floor(ms / 1000)
  return { days, hrs, min, sec }
}

export default function Home() {
  const [t, setT] = useState(() => diffToParts(WEDDING_DATE))

  useEffect(() => {
    const id = setInterval(() => setT(diffToParts(WEDDING_DATE)), 1000)
    return () => clearInterval(id)
  }, [])

  const units = [
    { n: String(t.days), l: 'Days' },
    { n: String(t.hrs).padStart(2, '0'), l: 'Hrs' },
    { n: String(t.min).padStart(2, '0'), l: 'Min' },
    { n: String(t.sec).padStart(2, '0'), l: 'Sec' },
  ]

  return (
    <section className="scene home">
      <div className="home-stage">
        <figure className="home-figure plx" style={{ '--d': '16px' }}>
          <span className="home-figure-glow" aria-hidden="true" />
          {/* rev-fade (opacity only), NOT rev-pop: a transform-animating reveal
              would override the .home-img scale() overscan and let the parallax
              drift bare the background at the edges. */}
          <img
            src={heroPhoto}
            alt="Elizabeth and Benjamin"
            className="home-img rev-fade"
            style={{ '--rd': '120ms' }}
            width="1068"
            height="1600"
            decoding="async"
          />
        </figure>

        <div className="home-copy">
          <p className="home-tag rev-fall" style={{ '--rd': '220ms' }}>Save the Date</p>

          <h1 className="home-names">
            <span className="home-name rev-mask" style={{ '--rd': '320ms' }}>Elizabeth</span>
            <span className="home-amp plx" style={{ '--d': '-18px' }}>
              <span className="rev-pop" style={{ '--rd': '660ms' }}>&amp;</span>
            </span>
            <span className="home-name rev-mask" style={{ '--rd': '480ms' }}>Benjamin</span>
          </h1>

          <span className="home-rule rev-grow" style={{ '--rd': '820ms' }} />
          <p className="home-date rev" style={{ '--rd': '900ms' }}>Saturday &middot; 29 May 2027 &middot; 4:00 PM</p>

          <div className="home-countdown" aria-label="Time until the wedding">
            {units.map((u, i) => (
              <div className="hcd-item rev-pop" style={{ '--rd': `${980 + i * 90}ms` }} key={u.l}>
                <span className="hcd-num">{u.n}</span>
                <span className="hcd-lbl">{u.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
