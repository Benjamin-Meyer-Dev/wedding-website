import { Crown, Flower, Flower2, Gem, User } from 'lucide-react'
import './Party.css'

// Portraits live in src/assets/party, already cropped square on the face so the
// circle has nothing left to trim. Each person has a pair - `Name.jpg` at 144px
// and `Name-2x.jpg` at 288px - and the browser fetches only the one its pixel
// density calls for (see .party-photo--img in Party.css). Keyed by filename
// minus the extension, so adding someone is a matter of dropping the pair in.
const PHOTOS = Object.fromEntries(
  Object.entries(import.meta.glob('../assets/party/*.jpg', { eager: true, import: 'default' }))
    .map(([path, url]) => [path.split('/').pop().replace(/\.jpg$/i, ''), url])
)
const photo = (key) => (key && PHOTOS[key]) || ''

// Two sides of the aisle. Every person gets the same card; the lead (Maid of
// Honor / Best Man) is marked `lead: true` and picks up extra accents only —
// same size as everyone else. `BadgeIcon` puts a small icon badge on the
// photo (leads, flower girl, ring bearer). A `photo` naming a file that isn't
// there falls back to the placeholder icon, so the build never breaks on a
// portrait that hasn't been added yet.
const HER_SIDE = {
  key: 'her',
  label: 'Her Side',
  people: [
    { role: 'Maid of Honor', name: 'Emily Box', blurb: 'Part sister, part best friend, part 24/7 hotline.', photo: 'Emily', lead: true, BadgeIcon: Flower2 },
    { role: 'Bridesmaid', name: 'Sara Williams', blurb: 'Childhood bestie and trusted recipient of every insignificant life update.', photo: 'Sara' },
    { role: 'Bridesmaid', name: 'Evelyn Ysselstein', blurb: 'Sunset swims, paddle board partner, and a lifelong battle over who finishes the book first.', photo: 'Evelyn' },
    { role: 'Bridesmaid', name: 'Melissa Hannus', blurb: 'Loyal friend, adventure partner, and only slightly obsessed with her dog.', photo: 'Melissa' },
    { role: 'Bridesmaid', name: 'Cassidy Shortt', blurb: 'The reason my bookshelf is full and my coffee budget is empty.', photo: 'Cassidy' },
    { role: 'Ring Bearer', name: 'Kathleen Box', blurb: 'Entrusted with the most important delivery of the day.', photo: '', BadgeIcon: Gem },
  ],
}

const HIS_SIDE = {
  key: 'his',
  label: 'His Side',
  people: [
    { role: 'Best Man', name: 'Colin Bakker', blurb: 'High school friend, climbing accomplice, and firm believer that studying for math tests was optional.', photo: 'Colin', lead: true, BadgeIcon: Crown },
    { role: 'Groomsman', name: 'Joshua Meyer', blurb: 'The brother who went to the Yukon to study moss and came back knowing how to cook Spam.', photo: '' },
    { role: 'Groomsman', name: 'Todd Box', blurb: 'Part inherited brother, part handyman, part outdoorsman, and somehow responsible for three kids.', photo: 'Todd' },
    { role: 'Groomsman', name: 'Connor Caddigan', blurb: 'High school friend, former Big Red pilot, and victim of a golf swing that has never met a fairway it couldn’t avoid.', photo: '' },
    { role: 'Groomsman', name: 'Holden Ryder', blurb: 'Ben’s personal breaking-news service, fantasy football consultant, and occasional financial advisor specializing in unnecessary gambling.', photo: 'Holden' },
    { role: 'Flower Boy', name: 'Timothy Box', blurb: 'Ready to scatter petals with great ceremony.', photo: '', BadgeIcon: Flower },
  ],
}

function Person({ person, tone, delay }) {
  const src = photo(person.photo)
  const src2x = photo(`${person.photo}-2x`) || src
  return (
    <article
      className={`party-person${person.lead ? ' party-person--lead' : ''} rev-fade`}
      style={{ '--rd': `${delay}ms` }}
    >
      <figure
        className={`party-photo tone-${tone}${src ? ' party-photo--img' : ''}`}
        style={src ? { '--photo': `url(${src})`, '--photo-2x': `url(${src2x})` } : undefined}
      >
        {!src && <User aria-hidden="true" />}
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
          <Person key={p.name} person={p} tone={i % 3} delay={baseDelay + 50 + i * 40} />
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
          <h1 className="page-title rev" style={{ '--rd': '70ms' }}>By Our Sides</h1>
        </header>

        <div className="party-sides">
          <Side side={HER_SIDE} baseDelay={190} />
          <div className="party-divider" aria-hidden="true"><span className="party-amp">&amp;</span></div>
          <Side side={HIS_SIDE} baseDelay={220} />
        </div>
      </div>
    </section>
  )
}
