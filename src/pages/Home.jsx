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
      <figure className="hero-figure">
        <img
          src={heroPhoto}
          alt="Elizabeth and Benjamin"
          className="hero-img"
          width="1068"
          height="1600"
        />
      </figure>

      <article className="hero-content glass">
        <p className="hero-tag">Save the Date</p>
        <h1 className="hero-names">
          <span className="name">Elizabeth</span>
          <span className="amp">&amp;</span>
          <span className="name">Benjamin</span>
        </h1>
        <div className="hero-rule" />
        <p className="hero-date">Saturday &middot; 29 May 2027 &middot; 4:00 PM</p>

        <div className="hero-countdown" aria-label="Time until the wedding">
          <div className="hcd-item">
            <span className="hcd-num">{String(t.days).padStart(3, '0').replace(/^0+(\d)/, '$1')}</span>
            <span className="hcd-lbl">Days</span>
          </div>
          <div className="hcd-item">
            <span className="hcd-num">{String(t.hrs).padStart(2, '0')}</span>
            <span className="hcd-lbl">Hrs</span>
          </div>
          <div className="hcd-item">
            <span className="hcd-num">{String(t.min).padStart(2, '0')}</span>
            <span className="hcd-lbl">Min</span>
          </div>
          <div className="hcd-item">
            <span className="hcd-num">{String(t.sec).padStart(2, '0')}</span>
            <span className="hcd-lbl">Sec</span>
          </div>
        </div>
      </article>
    </section>
  )
}
