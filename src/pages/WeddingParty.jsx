import { Crown, Flower, Flower2, Gem, User } from 'lucide-react'
import './party.css'

// Two sides of the aisle. Every person gets the same card; the lead (Maid of
// Honor / Best Man) is marked `lead: true` and picks up extra accents only —
// same size as everyone else. `BadgeIcon` puts a small icon badge on the
// photo (leads, flower girl, ring bearer). Drop a URL into any `photo` for a
// real picture.
const HER_SIDE = {
  key: 'her',
  label: 'Her Side',
  people: [
    { role: 'Maid of Honor', name: 'Emily Box', blurb: 'Elizabeth’s lifelong partner in mischief and her first call for everything.', photo: '', lead: true, BadgeIcon: Flower2 },
    { role: 'Bridesmaid', name: 'Cassidy Shortt', blurb: 'Forever friend and the world’s most enthusiastic dancer.', photo: '' },
    { role: 'Bridesmaid', name: 'Evelyn Ysselstein', blurb: 'Calm in every storm and the group’s unofficial photographer.', photo: '' },
    { role: 'Bridesmaid', name: 'Melissa Hannus', blurb: 'Brunch ringleader and keeper of years of inside jokes.', photo: '' },
    { role: 'Bridesmaid', name: 'Sara Williams', blurb: 'Confidante and always first to start the singalong.', photo: '' },
    { role: 'Flower Girl', name: 'Kathleen Box', blurb: 'Ready to scatter petals with great ceremony.', photo: '', BadgeIcon: Flower },
  ],
}

const HIS_SIDE = {
  key: 'his',
  label: 'His Side',
  people: [
    { role: 'Best Man', name: 'Colin Bakker', blurb: 'The steadiest hand in any room, speech at the ready.', photo: '', lead: true, BadgeIcon: Crown },
    { role: 'Groomsman', name: 'Connor Caddigan', blurb: 'Partner on every questionable road trip.', photo: '' },
    { role: 'Groomsman', name: 'Holden Ryder', blurb: 'The loudest cheer in any crowd.', photo: '' },
    { role: 'Groomsman', name: 'Joshua Meyer', blurb: 'Grill master and keeper of the playlist.', photo: '' },
    { role: 'Groomsman', name: 'Todd Box', blurb: 'Shows up early and stays to stack the chairs.', photo: '' },
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
