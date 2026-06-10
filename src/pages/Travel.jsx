import { useEffect, useState } from 'react'
import { Clock as IconClock, MapPin as IconPin, Car as IconCar, Navigation as IconNav } from 'lucide-react'
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

// Approximate drive time church → reception, shown on the connector badge.
const DRIVE = '~20 min'

const query = (v) => `${v.name}, ${v.address}`
const mapSrc = (v) => `https://www.google.com/maps?q=${encodeURIComponent(query(v))}&output=embed`
// "Get Directions" → directions mode with the venue as destination and NO origin,
// so Google asks the guest to pick their own start point.
const dirUrl = (v) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query(v))}`
// Pre-filled route used by the connector badge: church → reception.
const routeUrl = (from, to) =>
  `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(query(from))}&destination=${encodeURIComponent(query(to))}`

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
        <div className="tv-actions">
          <a className="tv-action tv-action--primary" href={dirUrl(v)} target="_blank" rel="noopener noreferrer">
            <IconNav /> Get Directions
          </a>
        </div>
      </div>
    </article>
  )
}

export default function Travel() {
  return (
    <section className="scene travel">
      <div className="travel-inner">
        <header className="travel-head">
          <h1 className="page-title rev" style={{ '--rd': '160ms' }}>Getting There</h1>
        </header>

        <div className="travel-venues">
          <Venue venue={VENUES[0]} i={0} />

          <div className="travel-route">
            <span className="travel-route-line rev" style={{ '--rd': '640ms' }} aria-hidden="true" />
            <a
              className="travel-route-badge rev-pop"
              style={{ '--rd': '820ms' }}
              href={routeUrl(VENUES[0], VENUES[1])}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Get directions from ${VENUES[0].name} to ${VENUES[1].name}`}
              title={`Directions: ${VENUES[0].name} → ${VENUES[1].name}`}
            >
              <IconCar />
              <span className="travel-route-time">{DRIVE}</span>
              <span className="travel-route-cta">Directions <IconNav /></span>
            </a>
            <span className="travel-route-line rev" style={{ '--rd': '700ms' }} aria-hidden="true" />
          </div>

          <Venue venue={VENUES[1]} i={1} />
        </div>
      </div>
    </section>
  )
}
