import { Crown, Flower2, User } from 'lucide-react'
import './party.css'

// Two sides of the aisle. Every person gets the same card; the lead (Maid of
// Honor / Best Man) is marked `lead: true` and picks up extra accents only —
// same size as everyone else. Drop a URL into any `photo` for a real picture.
const HER_SIDE = {
  key: 'her',
  label: 'Her Side',
  LeadIcon: Flower2,
  people: [
    { role: 'Maid of Honor', name: 'Charlotte Hayes', blurb: 'Elizabeth’s sister and lifelong partner in mischief, her first call for everything.', photo: '', lead: true },
    { role: 'Bridesmaid', name: 'Ava Thompson', blurb: 'College roommate turned forever friend, and the world’s most enthusiastic dancer.', photo: '' },
    { role: 'Bridesmaid', name: 'Mia Romano', blurb: 'Brunch ringleader and keeper of two decades of inside jokes.', photo: '' },
    { role: 'Bridesmaid', name: 'Grace Patel', blurb: 'Calm in every storm and the group’s unofficial photographer.', photo: '' },
    { role: 'Bridesmaid', name: 'Hannah Cole', blurb: 'Cousin, confidante, and always first to start the singalong.', photo: '' },
  ],
}

const HIS_SIDE = {
  key: 'his',
  label: 'His Side',
  LeadIcon: Crown,
  people: [
    { role: 'Best Man', name: 'James Carter', blurb: 'Benjamin’s brother and the steadiest hand in any room, speech at the ready.', photo: '', lead: true },
    { role: 'Groomsman', name: 'Daniel Walsh', blurb: 'Childhood neighbor and partner on every questionable road trip.', photo: '' },
    { role: 'Groomsman', name: 'Ethan Brooks', blurb: 'Teammate since little league and the loudest cheer in any crowd.', photo: '' },
    { role: 'Groomsman', name: 'Noah Foster', blurb: 'College roommate, grill master, and keeper of the playlist.', photo: '' },
    { role: 'Groomsman', name: 'Liam Park', blurb: 'The friend who shows up early and stays to stack the chairs.', photo: '' },
  ],
}

function Person({ person, LeadIcon, tone, delay }) {
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
        {person.lead && <span className="party-badge" aria-hidden="true"><LeadIcon /></span>}
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
          <Person key={p.name} person={p} LeadIcon={side.LeadIcon} tone={i % 3} delay={baseDelay + 90 + i * 70} />
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
