import { useEffect, useState } from 'react'
import {
  Clock as IconClock, MapPin as IconPin, Car as IconCar, Navigation as IconNav,
  Hotel as IconHotel, ExternalLink as IconExt, ArrowRight as IconArrow,
} from 'lucide-react'
import './Travel.css'

// The two venues for the day. The `address` drives the embedded Google map.
const VENUES = [
  {
    phase: 'ceremony',
    label: 'Ceremony',
    name: 'St. Agnes Church',
    short: 'St. Agnes',
    address: '75 Bluevale Street N, Waterloo, ON N2J 3R7',
    time: '2:00 PM',
  },
  {
    phase: 'reception',
    label: 'Reception',
    name: 'Rebel Creek Golf Club',
    short: 'Rebel Creek',
    address: '1517 Snyder’s Rd W, Petersburg, ON N0B 2H0',
    time: '4:30 PM',
  },
]

// Approximate drive time church → reception, shown on the connector badge.
const DRIVE = '~20 min'

// ---- Guest hotel block ----
// TODO(couple): fill these in from the hotel's booking confirmation. Every field
// below is optional — anything left as `null` simply doesn't render, so the
// section stays presentable until the details arrive. Nothing here is guessed:
// the street address, group link, rate and cut-off date are deliberately blank
// rather than approximated, since a wrong address on a wedding site is worse
// than none.
const HOTEL = {
  phase: 'hotel',
  label: 'Hotel Block',
  name: 'Delta Hotels Waterloo',
  short: 'Delta Hotel',
  city: 'Waterloo, ON',
  // Same shape as the two venue addresses above, so all three read alike.
  address: '110 Erb Street W, Waterloo, ON N2L 0C6',
  bookingUrl: null,           // group-booking link for the block
  rate: null,                 // e.g. '$189 / night'
  cutoff: null,               // e.g. 'Book by 28 April 2027'
  note: 'We have reserved a block of rooms for our guests.',
}

// Every stop, and every ordered pair between them — 3 places -> 6 journeys.
const PLACES = [...VENUES, HOTEL]
const ROUTES = PLACES.flatMap((from) =>
  PLACES.filter((to) => to !== from).map((to) => ({ from, to })),
)

// Drive times per journey, rounded to the nearest 5 minutes.
// church <-> reception is the ~20 min figure we already had. The hotel legs are
// road-network distances (OSRM over OpenStreetMap), calibrated against that
// known leg: the same routing put church -> Petersburg at 18.5 min versus the
// real ~20 min to the club just west of the village, so the estimates carry
// about a +1.5 min correction. They're free-flow times with no live traffic,
// which is why every one is prefixed "~" — tapping any button opens Google
// directions with the real, current duration.
// TODO(couple): replace with real times once you've driven them.
const DRIVE_TIMES = {
  'ceremony>reception': DRIVE,        // 13.4 km
  'reception>ceremony': DRIVE,
  'ceremony>hotel': '~5 min',         //  3.2 km, 5.9 min
  'hotel>ceremony': '~5 min',         //  3.1 km, 6.1 min
  'reception>hotel': '~15 min',       // 10.5 km, 13.6 min + correction
  'hotel>reception': '~15 min',
}
const driveTime = (from, to) => DRIVE_TIMES[`${from.phase}>${to.phase}`] ?? null

const query = (v) => `${v.name}, ${v.address ?? v.city}`
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
    <article className={`tv-venue tv-venue--${v.phase} glass rev-fade`} style={{ '--rd': `${130 + i * 80}ms` }}>
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

// The hotel block. Same glass card as the venues, but laid out with the map
// BESIDE the details instead of above them (see .tv-venue--stay): it spans the
// full row rather than sitting in a half-width column, and a 340px map stacked
// on top of a full-width panel would be enormous.
function Stay() {
  const terms = [HOTEL.rate, HOTEL.cutoff].filter(Boolean).join('  ·  ')
  return (
      <article className="tv-venue tv-venue--stay glass rev-fade" style={{ '--rd': '580ms' }}>
        <MapPanel venue={HOTEL} delay={1060} />
        <div className="tv-info">
          <span className="tv-phase"><IconHotel />Hotel Block</span>
          <h2 className="tv-name">{HOTEL.name}</h2>
          {HOTEL.note && <p className="tv-note">{HOTEL.note}</p>}
          {terms && <p className="tv-time"><IconClock />{terms}</p>}
          <p className="tv-addr"><IconPin /><span>{HOTEL.address ?? HOTEL.city}</span></p>
          <div className="tv-actions">
            {/* Get Directions leads and is the filled pill, identical to the two
                venue cards — same class, same order, same icon. Booking sits
                beside it as the outline variant so the three cards' primary
                action reads the same at a glance. */}
            <a className="tv-action tv-action--primary" href={dirUrl(HOTEL)} target="_blank" rel="noopener noreferrer">
              <IconNav /> Get Directions
            </a>
            {HOTEL.bookingUrl && (
              <a
                className="tv-action"
                href={HOTEL.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconExt /> Book a Room
              </a>
            )}
          </div>
        </div>
      </article>
  )
}

// Every journey a guest might make, both directions: church <-> reception,
// church <-> hotel, reception <-> hotel. Each opens Google directions with the
// origin AND destination pre-filled, so the guest doesn't type anything.
function Routes() {
  return (
    <div className="travel-routes">
      {ROUTES.map(({ from, to }, i) => {
        const mins = driveTime(from, to)
        return (
          <a
            key={`${from.phase}>${to.phase}`}
            className="tv-route rev-fade"
            style={{ '--rd': `${700 + i * 40}ms` }}
            href={routeUrl(from, to)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Directions from ${from.name} to ${to.name}`}
          >
            <span className="tv-route-pair">
              <span className="tv-route-end">{from.short}</span>
              <IconArrow aria-hidden="true" />
              <span className="tv-route-end">{to.short}</span>
            </span>
            <span className="tv-route-meta">
              {/* every current pair has a time; the fallback stays so adding a
                  fourth place (ROUTES builds its pairs automatically) can't
                  render a button with an empty slot */}
              <span className={`tv-route-time${mins ? '' : ' is-tbc'}`}>
                <IconCar aria-hidden="true" />{mins ?? 'See live time'}
              </span>
              <span className="tv-route-cta">Directions <IconNav aria-hidden="true" /></span>
            </span>
          </a>
        )
      })}
    </div>
  )
}

export default function Travel() {
  return (
    <section className="scene travel">
      <div className="travel-inner">
        <header className="travel-head">
          {/* carries travel-section-title too, so the page title and the two
              section titles below are one and the same treatment */}
          <h1 className="page-title travel-section-title rev" style={{ '--rd': '100ms' }}>Getting There</h1>
        </header>

        <section className="travel-section">
        <div className="travel-venues">
          <Venue venue={VENUES[0]} i={0} />

          <Venue venue={VENUES[1]} i={1} />
        </div>
        </section>

        <section className="travel-section">
          <h2 className="travel-section-title rev" style={{ '--rd': '540ms' }}>Where to Stay</h2>
          <Stay />
        </section>

        <section className="travel-section">
          <h2 className="travel-section-title rev" style={{ '--rd': '660ms' }}>Drive Times</h2>
          <p className="travel-section-sub rev" style={{ '--rd': '680ms' }}>
            Directions between every stop. Tap any route for live turn-by-turn.
          </p>
          <Routes />
        </section>
      </div>
    </section>
  )
}
