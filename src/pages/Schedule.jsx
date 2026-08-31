import { useEffect, useRef, useState } from 'react'
import { DoorOpen, Church, Car, Martini, Utensils, Music, Wine, Sparkles, MapPin } from 'lucide-react'
import heroPhoto from '../assets/HomePage.jpg'
import welcomePhoto from '../assets/Welcome.jpg'
import massPhoto from '../assets/Mass.jpg'
import travelPhoto from '../assets/Travel.jpg'
import cocktailPhoto from '../assets/Cocktail.jpg'
import dinnerPhoto from '../assets/Dinner.jpg'
import partyPhoto from '../assets/Party.jpg'
import barPhoto from '../assets/Bar.jpg'
import sparklersPhoto from '../assets/Sparklers.jpg'
import './Schedule.css'

// One continuous timeline of the day, flowing from the afternoon ceremony
// into the evening reception. Each event's end is the next event's start
// (the last runs to midnight). `photo` is a bundled image from src/assets;
// `icon` is the Lucide icon shown in the event's timeline medallion.
const EVENTS = [
  { time: '1:30 PM', title: 'Guests Arrive', venue: 'St. Agnes Church', desc: 'Find your seat before the procession.', phase: 'ceremony', icon: 'arrive', photo: welcomePhoto },
  { time: '2:00 PM', title: 'Mass Starts', venue: 'St. Agnes Church', desc: 'The nuptial Mass begins.', phase: 'ceremony', icon: 'church', photo: massPhoto },
  { time: '3:30 PM', title: 'Travel to Reception', venue: 'En route', desc: 'A short drive over to the celebration.', phase: 'ceremony', icon: 'car', photo: travelPhoto },
  { time: '4:30 PM', title: 'Cocktail Hour', venue: 'Rebel Creek Golf Club', desc: 'Drinks & canapés out on the terrace.', phase: 'reception', icon: 'cocktail', photo: cocktailPhoto },
  { time: '6:00 PM', title: 'Dinner Start', venue: 'Rebel Creek Golf Club', desc: 'A seated dinner is served.', phase: 'reception', icon: 'dinner', photo: dinnerPhoto },
  { time: '8:00 PM', title: 'Party Time', venue: 'Rebel Creek Golf Club', desc: 'The dance floor opens, let’s celebrate.', phase: 'reception', icon: 'music', photo: partyPhoto },
  { time: '11:30 PM', title: 'Last Call', venue: 'Rebel Creek Golf Club', desc: 'One more from the bar before we wrap.', phase: 'reception', icon: 'glass', photo: barPhoto },
  { time: '12:00 AM', title: 'Heading Home', venue: 'Rebel Creek Golf Club', desc: 'A sparkler send-off as you head home.', phase: 'reception', icon: 'home', photo: sparklersPhoto },
]

const ROTATE_MS = 8000   // how long each card stays up
// The comet travels for a fixed 450ms (CSS) regardless of step count. The card
// fades + zooms out over the first half, swaps at the midpoint (while hidden),
// then fades + settles back in over the second half, as the pulse arrives.
const SWAP_AT = 225
// The last event is a send-off (a moment, not a span), so it shows just its
// time; every other event shows a start–end range.
const endOf = (i) => (i < EVENTS.length - 1 ? EVENTS[i + 1].time : null)
const timeText = (i) => {
  const end = endOf(i)
  return end ? `${EVENTS[i].time} – ${end}` : EVENTS[i].time
}

// ---------- Lucide line-icons, one per timeline event ----------
const ICONS = { arrive: DoorOpen, church: Church, car: Car, cocktail: Martini, dinner: Utensils, music: Music, glass: Wine, home: Sparkles }
function Icon({ name }) {
  const C = ICONS[name]
  return C ? <C /> : null
}
const Pin = () => <MapPin />

export default function Schedule() {
  const [hovered, setHovered] = useState(null)
  const [pinned, setPinned] = useState(null)
  const [heroHover, setHeroHover] = useState(false)
  const [auto, setAuto] = useState(0)
  const [displayIdx, setDisplayIdx] = useState(0) // what the stage currently shows
  const timelineRef = useRef(null)

  // The active highlight auto-advances on every layout — the desktop stage AND
  // the mobile vertical timeline, where it simply steps the lit circle for a bit
  // of life (all the cards are already shown). Pauses while the guest is
  // hovering/pinning a node or hovering the hero.
  const paused = hovered != null || pinned != null || heroHover

  // Preload every card photo once so a rotated-to image is already decoded and
  // shows immediately — no placeholder flash or fade when the stage swaps.
  // Fetched one at a time, each in an idle slot: kicking off all eight at once
  // put ~600KB of decode work up against the page's entrance animation, and the
  // stage only needs the next photo 8s later anyway.
  useEffect(() => {
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200))
    const cancelIdle = window.cancelIdleCallback || clearTimeout
    let handle = null
    let cancelled = false
    let i = 0
    const next = () => {
      if (cancelled || i >= EVENTS.length) return
      const ev = EVENTS[i++]
      if (!ev.photo) return next()
      const img = new Image()
      img.onload = img.onerror = () => { handle = idle(next) }
      img.src = ev.photo
    }
    handle = idle(next)
    return () => { cancelled = true; if (handle != null) cancelIdle(handle) }
  }, [])

  const [hidden, setHidden] = useState(() => document.hidden)
  useEffect(() => {
    const onVis = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  useEffect(() => {
    // A backgrounded tab shouldn't keep swapping stage photos and restarting
    // the comet — nobody is watching, and the work still costs battery.
    if (paused || hidden) return
    const id = setInterval(() => setAuto((a) => (a + 1) % EVENTS.length), ROTATE_MS)
    return () => clearInterval(id)
  }, [paused, hidden])

  // Hover wins, then a pinned (clicked) node, then the auto-rotation.
  const activeIdx = hovered != null ? hovered : pinned != null ? pinned : auto

  // Fade the card out over the first half of the pulse's travel; swap at the
  // midpoint (while fully faded, so the change is hidden); then fade the new
  // card in over the second half, finishing as the pulse reaches the circle.
  useEffect(() => {
    if (activeIdx === displayIdx) return
    const t = setTimeout(() => setDisplayIdx(activeIdx), SWAP_AT)
    return () => clearTimeout(t)
  }, [activeIdx, displayIdx])

  // Vertical comet geometry: the horizontal bar is driven by the linear
  // --tl-progress fraction, but the stacked mobile cards have uneven heights, so
  // measure the markers' real offsets. --tl-fill (px) positions the head and
  // --tl-frac (0..1 of --tl-total) scales the fill; CSS transitions both, so the
  // comet travels to the active circle just like the horizontal one.
  // The observer is set up once and reads the live index through a ref —
  // re-subscribing a ResizeObserver on every rotation forced an extra layout
  // pass each time. Re-measures on reflow (resize / font + image loads).
  const activeRef = useRef(0)
  activeRef.current = activeIdx ?? 0
  useEffect(() => {
    const el = timelineRef.current
    if (!el) return
    const measure = () => {
      const nodes = el.querySelectorAll('.tl-node')
      if (!nodes.length) return
      const i = Math.min(activeRef.current, nodes.length - 1)
      const top = nodes[0].offsetTop
      const fill = Math.max(0, nodes[i].offsetTop - top)
      const total = Math.max(1, nodes[nodes.length - 1].offsetTop - top)
      el.style.setProperty('--tl-total', `${total}px`)
      el.style.setProperty('--tl-fill', `${fill}px`)
      el.style.setProperty('--tl-frac', `${fill / total}`)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // Re-position on every change of the active node (cheap: reads offsets that
  // the browser already has, no observer churn).
  useEffect(() => {
    const el = timelineRef.current
    if (!el) return
    const nodes = el.querySelectorAll('.tl-node')
    if (!nodes.length) return
    const i = Math.min(activeIdx ?? 0, nodes.length - 1)
    const top = nodes[0].offsetTop
    const fill = Math.max(0, nodes[i].offsetTop - top)
    const total = Math.max(1, nodes[nodes.length - 1].offsetTop - top)
    el.style.setProperty('--tl-fill', `${fill}px`)
    el.style.setProperty('--tl-frac', `${fill / total}`)
  }, [activeIdx])

  const covering = activeIdx !== displayIdx
  const shown = displayIdx != null ? EVENTS[displayIdx] : null
  const tone = shown ? shown.phase : 'idle'

  const toggle = (i) => setPinned((p) => (p === i ? null : i))
  const enter = (i) => { setHovered(i); setAuto(i) } // resume rotation from here on leave

  return (
    <section className="sched">
      <header className="page-head sched-head">
        <h1 className="page-title rev" style={{ '--rd': '120ms' }}>Order of the Day</h1>
      </header>

      {/* Hovering anywhere in the hero pauses the auto-rotation. */}
      <div
        className="sched-hero"
        onMouseEnter={() => setHeroHover(true)}
        onMouseLeave={() => setHeroHover(false)}
      >
        {/* Cinematic aura that shifts colour with the active phase. */}
        <div className={`sched-aura sched-aura--${tone}`} aria-hidden="true" />

        {/* Center stage (desktop): rotating images + details. */}
        <div className={`sched-stage sched-stage--${tone}${covering ? ' is-covering' : ''} glass`} aria-hidden="true">
          <div className="stage-shell">
            <div className={`stage-photo stage-photo--${tone}`}>
              {shown ? (
                <img
                  className="stage-img"
                  key={`img-${displayIdx}`}
                  src={shown.photo}
                  alt=""
                  decoding="async"
                  draggable={false}
                  onLoad={(e) => e.currentTarget.classList.add('is-loaded')}
                  onError={(e) => e.currentTarget.classList.remove('is-loaded')}
                />
              ) : (
                <img className="stage-img is-loaded" src={heroPhoto} alt="" draggable={false} />
              )}
            </div>

            <div className="stage-text">
              <div className="stage-detail">
                {shown ? (
                  <>
                    <span className="stage-phase">{shown.phase === 'ceremony' ? 'Ceremony' : 'Reception'}</span>
                    <h2 className="stage-title">{shown.title}</h2>
                    <span className="stage-time">{timeText(displayIdx)}</span>
                    <p className="stage-venue"><Pin />{shown.venue}</p>
                    <p className="stage-desc">{shown.desc}</p>
                    {displayIdx < EVENTS.length - 1 && (
                      <p className="stage-next">Up next &middot; {EVENTS[displayIdx + 1].title}</p>
                    )}
                  </>
                ) : (
                  <>
                    <span className="stage-phase">The Celebration</span>
                    <h2 className="stage-title stage-title--idle">Elizabeth &amp; Benjamin</h2>
                    <p className="stage-desc">Hover along the timeline below to follow the evening, hour by hour.</p>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>

        <div
          ref={timelineRef}
          className={`timeline${activeIdx != null ? ' has-active' : ''}`}
          style={{
            '--tl-count': EVENTS.length,
            '--tl-progress': activeIdx != null ? activeIdx / (EVENTS.length - 1) : 0,
          }}
          role="list"
          aria-label="Wedding day timeline"
        >
          <span className="timeline-line" aria-hidden="true" />
          <span className="timeline-progress" aria-hidden="true" />
          <span className="timeline-head" aria-hidden="true" />

          {EVENTS.map((ev, idx) => (
            <article
              className={`tl-node tl-node--${ev.phase}${activeIdx === idx ? ' is-active' : ''}${pinned === idx ? ' is-pinned' : ''}`}
              style={{ '--i': idx }}
              key={idx}
              role="listitem"
              tabIndex={0}
              aria-label={`${endOf(idx) ? `${ev.time} to ${endOf(idx)}` : ev.time}, ${ev.title}, ${ev.venue}. ${ev.desc}`}
              onMouseEnter={() => enter(idx)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => enter(idx)}
              onBlur={() => setHovered(null)}
              onClick={() => toggle(idx)}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggle(idx)
                }
              }}
            >
              <span className="tl-marker" aria-hidden="true"><Icon name={ev.icon} /></span>

              <div className="tl-base">
                <span className="tl-time">{ev.time}</span>
                <span className="tl-title">{ev.title}</span>
              </div>

              {/* Inline detail — shown in the mobile/vertical layout only. */}
              <div className="tl-card glass" aria-hidden="true">
                <span className="tl-card-phase">{ev.phase === 'ceremony' ? 'Ceremony' : 'Reception'}</span>
                <p className="tl-card-time">{timeText(idx)}</p>
                <p className="tl-card-venue">{ev.venue}</p>
                <p className="tl-card-desc">{ev.desc}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="sched-legend">
          <span className="sched-legend-item">
            <span className="sched-legend-dot sched-legend-dot--ceremony" />Ceremony
          </span>
          <span className="sched-legend-sep" aria-hidden="true">&middot;</span>
          <span className="sched-legend-item">
            <span className="sched-legend-dot sched-legend-dot--reception" />Reception
          </span>
        </div>
      </div>
    </section>
  )
}
