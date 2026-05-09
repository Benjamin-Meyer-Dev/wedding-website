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

  return (
    <section className="hero">
      {/* Right-side photo area. Drop your image into /public/couple.jpg
          and it will appear here. Until then, a moody placeholder shows. */}
      <div className="hero-photo" aria-hidden="true">
        <div className="hero-photo-img" style={{ backgroundImage: `url(${heroPhoto})` }} />
        <div className="hero-photo-fade" />
      </div>

      <div className="hero-content">
        <p className="eyebrow">
          <span className="rule" />
          <span>SATURDAY · MAY 29 · 2027</span>
        </p>

        <h1 className="names">
          <span className="name">Elizabeth</span>
          <span className="amp">&amp;</span>
          <span className="name">Benjamin</span>
        </h1>

        <p className="counting">
          <span className="rule short" />
          <span>COUNTING DOWN</span>
          <span className="rule short" />
        </p>

        <ul className="countdown" aria-label="Time until the wedding">
          <li>
            <span className="num">{String(t.days).padStart(3, '0').replace(/^0+(\d)/, '$1')}</span>
            <span className="lbl">DAYS</span>
          </li>
          <li>
            <span className="num">{String(t.hrs).padStart(2, '0')}</span>
            <span className="lbl">HRS</span>
          </li>
          <li>
            <span className="num">{String(t.min).padStart(2, '0')}</span>
            <span className="lbl">MIN</span>
          </li>
          <li>
            <span className="num">{String(t.sec).padStart(2, '0')}</span>
            <span className="lbl">SEC</span>
          </li>
        </ul>
      </div>
    </section>
  )
}
