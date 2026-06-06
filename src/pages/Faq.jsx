import { useState } from 'react'
import { Shirt, Martini, Baby, Car, Gift, Clock } from 'lucide-react'
import './faq.css'

// Answers are kept short so they read cleanly on the flip side of each card.
const FAQS = [
  { icon: 'wear', q: 'What should I wear?', a: 'Cocktail / semi-formal: garden-party elegant, in shoes you can dance in.' },
  { icon: 'bar', q: 'Will there be an open bar?', a: 'Yes! Cocktails, wine, and a full bar until last call at 11:30 PM.' },
  { icon: 'kids', q: 'Can I bring the kids?', a: 'It’s an adults-only evening, so please check your invite for named guests.' },
  { icon: 'parking', q: 'Where do I park?', a: 'Free parking at both venues. It’s a ~20-min drive between them, so carpool!' },
  { icon: 'gift', q: 'Is there a registry?', a: 'Your presence is the present. A registry link is on its way.' },
  { icon: 'time', q: 'When should I arrive?', a: 'Be seated by 1:30 PM. The ceremony begins at 2:00 sharp.' },
]

// One Lucide line icon per question topic.
const ICONS = { wear: Shirt, bar: Martini, kids: Baby, parking: Car, gift: Gift, time: Clock }
function Icon({ name }) {
  const C = ICONS[name]
  return C ? <C aria-hidden="true" /> : null
}

export default function Faq() {
  const [flipped, setFlipped] = useState({})
  const toggle = (i) => setFlipped((f) => ({ ...f, [i]: !f[i] }))

  return (
    <section className="scene faq">
      <div className="faq-inner">
        <header className="page-head faq-head">
          <p className="page-eyebrow rev-fall" style={{ '--rd': '120ms' }}>
            <span className="page-eyebrow-rule" />
            <span>You’ve Got Questions</span>
            <span className="page-eyebrow-rule" />
          </p>
          <h1 className="page-title rev" style={{ '--rd': '220ms' }}>Flip for Answers</h1>
        </header>

        <ul className="faq-grid">
          {FAQS.map((f, i) => (
            <li className="faq-cell rev-fade" style={{ '--rd': `${340 + i * 80}ms` }} key={i}>
              <div
                className={`faq-card${flipped[i] ? ' is-flipped' : ''}`}
                role="button"
                tabIndex={0}
                aria-pressed={!!flipped[i]}
                aria-label={`${flipped[i] ? 'Hide answer' : 'Reveal answer'} for ${f.q}`}
                onClick={() => toggle(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(i) }
                }}
              >
                <div className="faq-card-inner">
                  <div className="faq-face faq-front">
                    <span className="faq-num" aria-hidden="true"><Icon name={f.icon} /></span>
                    <span className="faq-q">{f.q}</span>
                  </div>
                  <div className="faq-face faq-back">
                    <span className="faq-a">{f.a}</span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
