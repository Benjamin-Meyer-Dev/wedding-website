import { Crown, Flower, Flower2, Gem, User } from 'lucide-react'
import './Party.css'

// Two sides of the aisle. Every person gets the same card; the lead (Maid of
// Honor / Best Man) is marked `lead: true` and picks up extra accents only —
// same size as everyone else. `BadgeIcon` puts a small icon badge on the
// photo (leads, flower girl, ring bearer). Drop a URL into any `photo` for a
// real picture.
const HER_SIDE = {
  key: 'her',
  label: 'Her Side',
  people: [
    { role: 'Maid of Honor', name: 'Emily Box', blurb: 'Part sister, part best friend, part 24/7 hotline.', photo: '', lead: true, BadgeIcon: Flower2 },
    { role: 'Bridesmaid', name: 'Melissa Hannus', blurb: 'Loyal friend, adventure partner, and only slightly obsessed with her dog.', photo: '' },
    { role: 'Bridesmaid', name: 'Cassidy Shortt', blurb: 'The reason my bookshelf is full and my coffee budget is empty.', photo: '' },
    { role: 'Bridesmaid', name: 'Sara Williams', blurb: 'Childhood bestie and trusted recipient of every insignificant life update.', photo: '' },
    { role: 'Bridesmaid', name: 'Evelyn Ysselstein', blurb: 'Sunset swims, paddle board partner, and a lifelong battle over who finishes the book first.', photo: '' },
    { role: 'Flower Girl', name: 'Kathleen Box', blurb: 'Ready to scatter petals with great ceremony.', photo: '', BadgeIcon: Flower },
  ],
}

const HIS_SIDE = {
  key: 'his',
  label: 'His Side',
  people: [
    { role: 'Best Man', name: 'Colin Bakker', blurb: 'High school friend, climbing accomplice, and firm believer that studying for math tests was optional.', photo: '', lead: true, BadgeIcon: Crown },
    { role: 'Groomsman', name: 'Joshua Meyer', blurb: 'The brother who went to the Yukon to study moss and came back knowing how to cook Spam.', photo: '' },
    { role: 'Groomsman', name: 'Todd Box', blurb: 'Part inherited brother, part handyman, part outdoorsman, and somehow responsible for two kids.', photo: '' },
    { role: 'Groomsman', name: 'Connor Caddigan', blurb: 'High school friend, former Big Red pilot, and victim of a golf swing that has never met a fairway it couldn’t avoid.', photo: '' },
    { role: 'Groomsman', name: 'Holden Ryder', blurb: 'Ben’s personal breaking-news service, fantasy football consultant, and occasional financial advisor specializing in unnecessary gambling.', photo: '' },
    { role: 'Ring Bearer', name: 'Timothy Box', blurb: 'Entrusted with the most important delivery of the day.', photo: '', BadgeIcon: Gem },
  ],
}

function Person({ person, tone, delay }) {
  return (
    <article
      className={`party-person${person.lead ? ' party-person--lead' : ''} rev-fade`}
      style={{ '--rd': `${delay}ms` }}
    >
      <figure
        className={`party-photo tone-${tone}`}
        style={person.photo ? { backgroundImage: `url(${person.photo})` } : undefined}
      >
        {!person.photo && <User aria-hidden="true" />}
        {person.BadgeIcon && <span className="party-badge" aria-hidden="true"><person.BadgeIcon /></span>}
      </figure>
      <div className="party-person-body">
        <span className="party-role">{person.role}</span>
        <h3 className="party-name">{person.name}</h3>
        <p className="party-blurb">{person.blurb}</p>
      </div>
    </article>
  )
}

function Side({ side, baseDelay }) {
  return (
    <section className={`party-side party-side--${side.key}`}>
      <h2 className="party-side-title rev" style={{ '--rd': `${baseDelay}ms` }}>{side.label}</h2>
      <div className="party-people">
        {side.people.map((p, i) => (
          <Person key={p.name} person={p} tone={i % 3} delay={baseDelay + 90 + i * 70} />
        ))}
      </div>
    </section>
  )
}

export default function WeddingParty() {
  return (
    <section className="scene party">
      <div className="party-inner">
        <header className="page-head party-head">
          <h1 className="page-title rev" style={{ '--rd': '120ms' }}>By Our Sides</h1>
        </header>

        <div className="party-sides">
          <Side side={HER_SIDE} baseDelay={320} />
          <div className="party-divider" aria-hidden="true"><span className="party-amp">&amp;</span></div>
          <Side side={HIS_SIDE} baseDelay={360} />
        </div>
      </div>
    </section>
  )
}
