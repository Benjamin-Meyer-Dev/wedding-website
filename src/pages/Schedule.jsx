import { useEffect, useState } from 'react'
import { DoorOpen, Church, Car, Martini, Utensils, Music, Wine, Sparkles, MapPin } from 'lucide-react'
import heroPhoto from '../assets/HomePage.jpg'
import './schedule.css'

// One continuous timeline of the day, flowing from the afternoon ceremony
// into the evening reception. Each event's end is the next event's start
// (the last runs to midnight). `photo` points at an optional image in
// /public/timeline/ — until those files exist, a themed placeholder shows.
const EVENTS = [
  { time: '1:30 PM', title: 'Guests Arrive', venue: 'St. Agnes Church', desc: 'Find your seat before the procession.', phase: 'ceremony', icon: 'arrive', photo: '/timeline/arrival.jpg' },
  { time: '2:00 PM', title: 'Mass Starts', venue: 'St. Agnes Church', desc: 'The nuptial Mass begins.', phase: 'ceremony', icon: 'church', photo: '/timeline/mass.jpg' },
  { time: '3:30 PM', title: 'Travel to Reception', venue: 'En route', desc: 'A short drive over to the celebration.', phase: 'ceremony', icon: 'car', photo: '/timeline/travel.jpg' },
  { time: '4:30 PM', title: 'Cocktail Hour', venue: 'Rebel Creek Golf Club', desc: 'Drinks & canapés out on the terrace.', phase: 'reception', icon: 'cocktail', photo: '/timeline/cocktails.jpg' },
  { time: '6:00 PM', title: 'Dinner Start', venue: 'Rebel Creek Golf Club', desc: 'A seated dinner is served.', phase: 'reception', icon: 'dinner', photo: '/timeline/dinner.jpg' },
  { time: '8:00 PM', title: 'Party Time', venue: 'Rebel Creek Golf Club', desc: 'The dance floor opens, let’s celebrate.', phase: 'reception', icon: 'music', photo: '/timeline/party.jpg' },
  { time: '11:30 PM', title: 'Last Call', venue: 'Rebel Creek Golf Club', desc: 'One more from the bar before we wrap.', phase: 'reception', icon: 'glass', photo: '/timeline/last-call.jpg' },
  { time: '12:00 AM', title: 'Heading Home', venue: 'Rebel Creek Golf Club', desc: 'A sparkler send-off as you head home.', phase: 'reception', icon: 'home', photo: '/timeline/heading-home.jpg' },
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

// True only on a wide, pointer-capable screen — where the stage is shown.
function useStageVisible() {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 821px) and (hover: hover)')
    const update = () => setOn(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return on
}

export default function Schedule() {
  const [hovered, setHovered] = useState(null)
  const [pinned, setPinned] = useState(null)
  const [heroHover, setHeroHover] = useState(false)
  const [auto, setAuto] = useState(0)
  const [displayIdx, setDisplayIdx] = useState(0) // what the stage currently shows
  const stageVisible = useStageVisible()

  // Rotation pauses whenever the guest is interacting, or off-stage (mobile).
  const paused = hovered != null || pinned != null || heroHover || !stageVisible
  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setAuto((a) => (a + 1) % EVENTS.length), ROTATE_MS)
    return () => clearInterval(id)
  }, [paused])

  // Hover wins, then a pinned (clicked) node, then the auto-rotation.
  const activeIdx = hovered != null ? hovered : pinned != null ? pinned : stageVisible ? auto : null

  // Fade the card out over the first half of the pulse's travel; swap at the
  // midpoint (while fully faded, so the change is hidden); then fade the new
  // card in over the second half, finishing as the pulse reaches the circle.
  useEffect(() => {
    if (activeIdx === displayIdx) return
    const t = setTimeout(() => setDisplayIdx(activeIdx), SWAP_AT)
    return () => clearTimeout(t)
  }, [activeIdx, displayIdx])

  const covering = activeIdx !== displayIdx
  const shown = displayIdx != null ? EVENTS[displayIdx] : null
  const tone = shown ? shown.phase : 'idle'

  const toggle = (i) => setPinned((p) => (p === i ? null : i))
  const enter = (i) => { setHovered(i); setAuto(i) } // resume rotation from here on leave

  return (
    <section className="sched">
      <header className="page-head sched-head">
        <p className="page-eyebrow rev-fall" style={{ '--rd': '120ms' }}>
          <span className="page-eyebrow-rule" />
          <span>The Celebration</span>
          <span className="page-eyebrow-rule" />
        </p>
        <h1 className="page-title rev" style={{ '--rd': '220ms' }}>Order of the Day</h1>
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
                <>
                  <span className="stage-photo-ph" key={`ph-${displayIdx}`}><Icon name={shown.icon} /></span>
                  {shown.photo && (
                    <img
                      className="stage-img"
                      key={`img-${displayIdx}`}
                      src={shown.photo}
                      alt=""
                      onLoad={(e) => e.currentTarget.classList.add('is-loaded')}
                      onError={(e) => e.currentTarget.classList.remove('is-loaded')}
                    />
                  )}
                  <span className="stage-photo-fade" />
                </>
              ) : (
                <>
                  <img className="stage-img is-loaded" src={heroPhoto} alt="" />
                  <span className="stage-photo-fade" />
                </>
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
