import { useState } from 'react'
import { Shirt, Martini, Baby, Car, Clock, BedDouble, UserPlus, Bus } from 'lucide-react'
import './Faq.css'

// Faces are fixed-height with `overflow: hidden`, so a question and its answer
// both have to fit inside one. The height tiers in Faq.css are sized to the
// longest of each: the parking question on the front (three lines on a phone,
// above a 70px icon) and its answer on the back.
const FAQS = [
  { icon: 'time', q: 'When should I arrive?', a: 'Be seated by 1:30 PM. The ceremony begins at 2:00 sharp.' },
  { icon: 'wear', q: 'What is the dress code?', a: 'We’d love for you to dress in church-friendly cocktail attire. Our wonderful wedding party will be dressed in blue on our special day!' },
  { icon: 'parking', q: 'Is there parking, or should we arrange a ride/shuttle?', a: 'There is parking at both the church and Rebel Creek. Feel free to leave your car at Rebel Creek overnight and hop on our shuttle to the Delta Hotel Waterloo. See the Travel page for details.' },
  // TODO(couple): the shuttle's departure time and pickup spot are deliberately
  // left out rather than guessed — same rule as the blank hotel fields in
  // Travel.jsx. Add them here (and to the Travel page, which has no shuttle
  // section yet even though two answers point guests at it) once they're set.
  { icon: 'shuttle', q: 'How do we get back to the hotel?', a: 'Our shuttle runs from Rebel Creek to the Delta Hotel Waterloo at the end of the night. Leave your car at the club overnight and pick it up in the morning.' },
  { icon: 'hotel', q: 'Is there a hotel block?', a: 'Yes! We have a hotel block at the Delta Hotel Waterloo. See the Travel page for the link and booking info.' },
  { icon: 'kids', q: 'Are kids invited?', a: 'As much as we love your little ones, we’ve decided to keep our wedding an adults-only celebration. Thanks for understanding!' },
  { icon: 'plusOne', q: 'Can I bring a plus-one?', a: 'To help us keep things intimate, we’re only able to accommodate the guests named on your invitation. Thanks for understanding!' },
  { icon: 'bar', q: 'Will there be an open bar?', a: 'Yes! Cocktails, wine, and a full bar until last call at 11:30 PM.' },
]

// One Lucide line icon per question topic.
const ICONS = { wear: Shirt, bar: Martini, kids: Baby, parking: Car, time: Clock, hotel: BedDouble, plusOne: UserPlus, shuttle: Bus }

function Icon({ name }) {
  const C = ICONS[name]
  return C ? <C aria-hidden="true" /> : null
}

export default function Faq() {
  // Only one card may be flipped at a time — track its index (null = none).
  // Flipping a different card flips the current one back.
  const [flipped, setFlipped] = useState(null)
  const toggle = (i) => setFlipped((cur) => (cur === i ? null : i))

  return (
    <section className="scene faq">
      <div className="faq-inner">
        <header className="page-head faq-head">
          <h1 className="page-title rev" style={{ '--rd': '70ms' }}>Flip for Answers</h1>
        </header>

        <ul className="faq-grid">
          {FAQS.map((f, i) => (
            <li className="faq-cell rev-fade" style={{ '--rd': `${200 + i * 50}ms` }} key={i}>
              <div
                className={`faq-card${flipped === i ? ' is-flipped' : ''}`}
                role="button"
                tabIndex={0}
                aria-pressed={flipped === i}
                aria-label={`${flipped === i ? 'Hide answer' : 'Reveal answer'} for ${f.q}`}
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
