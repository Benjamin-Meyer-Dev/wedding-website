import { useEffect, useRef } from 'react'
import { Camera } from 'lucide-react'
import './story.css'

// Each milestone has a `photo` slot. Add a URL to show a real photo; until then
// a themed tile stands in. Add as many milestones as you like.
const STORY = [
  { date: '2019', title: 'How We Met', text: 'A mutual friend’s birthday, a long conversation, and a night that flew by far too quickly.', photo: '' },
  { date: '2020', title: 'Our First Trip', text: 'A spontaneous road trip with far too many snacks and absolutely zero regrets.', photo: '' },
  { date: '2022', title: 'Moving In', text: 'One small apartment, two strong opinions on furniture, and endless laughter.', photo: '' },
  { date: '2024', title: 'The Proposal', text: 'On a quiet evening at home, the easiest yes either of us has ever said.', photo: '' },
  { date: '2027', title: 'The Big Day', text: 'And now, the moment we have been waiting for: celebrating it with all of you.', photo: '' },
]

// Extra candid photo slots. Add image URLs as you collect favourites.
const GALLERY = ['', '', '', '', '', '']

export default function Story() {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) ref.current.scrollTop = 0 }, [])

  return (
    <section className="scene story" ref={ref}>
      <div className="story-inner">
        <header className="page-head story-head">
          <h1 className="page-title rev" style={{ '--rd': '120ms' }}>Once Upon a Time</h1>
        </header>

        <div className="story-timeline">
          <span className="story-timeline-cap story-timeline-cap--top" aria-hidden="true" />
          {STORY.map((s, i) => (
            <article
              className={`story-item${i % 2 ? ' story-item--right' : ''} rev-fade`}
              style={{ '--rd': `${300 + i * 90}ms` }}
              key={i}
            >
              <figure
                className={`story-photo tone-${i % 3}`}
                style={s.photo ? { backgroundImage: `url(${s.photo})` } : undefined}
              >
                {!s.photo && <Camera aria-hidden="true" />}
              </figure>
              <span className="story-dot" aria-hidden="true" />
              <div className="story-content">
                <span className="story-date">{s.date}</span>
                <h2 className="story-title">{s.title}</h2>
                <p className="story-text">{s.text}</p>
              </div>
            </article>
          ))}
          <span className="story-timeline-cap story-timeline-cap--bottom" aria-hidden="true" />
        </div>

        <p className="story-gallery-label rev-fade" style={{ '--rd': '300ms' }}>A Few of Our Favourites</p>
        <div className="story-gallery">
          {GALLERY.map((src, i) => (
            <span
              key={i}
              className={`story-gallery-cell tone-${i % 3} rev-fade`}
              style={{ ...(src ? { backgroundImage: `url(${src})` } : {}), '--rd': `${360 + i * 60}ms` }}
            >
              {!src && <Camera aria-hidden="true" />}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
