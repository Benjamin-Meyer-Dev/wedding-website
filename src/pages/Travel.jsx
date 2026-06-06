import { useEffect, useState } from 'react'
import { Clock as IconClock, MapPin as IconPin, Car as IconCar } from 'lucide-react'
import './travel.css'

// The two venues for the day. The `address` drives the embedded Google map.
const VENUES = [
  {
    phase: 'ceremony',
    label: 'Ceremony',
    name: 'St. Agnes Church',
    address: '75 Bluevale Street N, Waterloo, ON N2J 3R7',
    time: '2:00 PM',
  },
  {
    phase: 'reception',
    label: 'Reception',
    name: 'Rebel Creek Golf Club',
    address: '1517 Snyder’s Rd W, Petersburg, ON N0B 2H0',
    time: '4:30 PM',
  },
]

// Rough drive time between the two venues, shown on the connector.
const DRIVE = '20 min'

const query = (v) => `${v.name}, ${v.address}`
const mapSrc = (v) => `https://www.google.com/maps?q=${encodeURIComponent(query(v))}&output=embed`

// The heavy Google embed is deferred: the page paints instantly with a styled
// placeholder, then the iframe mounts after a short stagger (or sooner on hover)
// and fades in once loaded — so two map apps don't block the initial load.
function MapPanel({ venue: v, delay }) {
  const [show, setShow] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div className="tv-map" onMouseEnter={() => setShow(true)}>
      <span className="tv-map-ph"><IconPin /></span>
      {show && (
        <iframe
          title={`Map to ${v.name}`}
          src={mapSrc(v)}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className={loaded ? 'is-loaded' : ''}
          onLoad={() => setLoaded(true)}
        />
      )}
      <span className="tv-map-sheen" />
    </div>
  )
}

function Venue({ venue: v, i }) {
  return (
    <article className={`tv-venue tv-venue--${v.phase} glass rev-fade`} style={{ '--rd': `${220 + i * 140}ms` }}>
      <MapPanel venue={v} delay={300 + i * 380} />
      <div className="tv-info">
        <span className="tv-phase">{v.label}</span>
        <h2 className="tv-name">{v.name}</h2>
        <p className="tv-time"><IconClock />{v.time}</p>
        <p className="tv-addr"><IconPin /><span>{v.address}</span></p>
      </div>
    </article>
  )
}

export default function Travel() {
  return (
    <section className="scene travel">
      <div className="travel-inner">
        <header className="travel-head">
          <p className="page-eyebrow rev-fall" style={{ '--rd': '160ms' }}>
            <span className="page-eyebrow-rule" />
            <span>Getting There</span>
            <span className="page-eyebrow-rule" />
          </p>
          <h1 className="page-title rev-mask" style={{ '--rd': '260ms' }}>Travel &amp; Venues</h1>
        </header>

        <div className="travel-venues">
          <Venue venue={VENUES[0]} i={0} />

          <div className="travel-route" aria-hidden="true">
            <span className="travel-route-line rev" style={{ '--rd': '640ms' }} />
            <span className="travel-route-badge rev-pop" style={{ '--rd': '820ms' }}>
              <IconCar />
              <span className="travel-route-time">{DRIVE}</span>
            </span>
            <span className="travel-route-line rev" style={{ '--rd': '700ms' }} />
          </div>

          <Venue venue={VENUES[1]} i={1} />
        </div>
      </div>
    </section>
  )
}
