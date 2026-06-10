import { useState } from 'react'
import { Plane, CookingPot, Cake, BedDouble, Wine, Coffee, ExternalLink } from 'lucide-react'
import './registry.css'

// Rough items. For each: set `price`, a real `link` (Buy Now destination), and
// optionally an `image` URL (product photo) — until then a themed panel shows.
const GIFTS = [
  { Icon: Plane,      title: 'Honeymoon Fund',        price: 'Any amount', link: '#', cta: 'Contribute', image: '' },
  { Icon: CookingPot, title: 'Enamel Dutch Oven',     price: '$380',       link: '#', cta: 'Buy Now',    image: '' },
  { Icon: Cake,       title: 'Stand Mixer',           price: '$430',       link: '#', cta: 'Buy Now',    image: '' },
  { Icon: BedDouble,  title: 'Linen Bedding Set',     price: '$220',       link: '#', cta: 'Buy Now',    image: '' },
  { Icon: Wine,       title: 'Crystal Wine Decanter', price: '$85',        link: '#', cta: 'Buy Now',    image: '' },
  { Icon: Coffee,     title: 'Espresso Machine',      price: '$600',       link: '#', cta: 'Buy Now',    image: '' },
]

export default function Registry() {
  const [active, setActive] = useState(0)
  const g = GIFTS[active]
  const Featured = g.Icon

  return (
    <section className="scene registry">
      <div className="registry-inner">
        <header className="page-head registry-head">
          <h1 className="page-title rev" style={{ '--rd': '120ms' }}>Gifts &amp; Good Wishes</h1>
        </header>

        <div className="reg-showcase">
          {/* Featured gift — title + buy button are overlaid on the photo (no
              separate footer row) so the picker list gets more height. */}
          <div className="reg-feature">
            <div
              className={`reg-stage-photo tone-${active % 3}`}
              key={active}
              style={g.image ? { backgroundImage: `url(${g.image})` } : undefined}
            >
              {!g.image && <span className="reg-stage-icon" aria-hidden="true"><Featured /></span>}
              <span className="reg-price">{g.price}</span>
              <div className="reg-stage-foot">
                <h2 className="reg-feature-title">{g.title}</h2>
                <a
                  className="reg-buy"
                  href={g.link}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => { if (g.link === '#') e.preventDefault() }}
                >
                  {g.cta} <ExternalLink />
                </a>
              </div>
            </div>
          </div>

          {/* Pick a gift — the list scrolls within the feature's height so the
              main (featured) area stays fully in frame no matter how many items. */}
          <div className="reg-list-wrap">
            <ul className="reg-list" aria-label="Registry items">
              {GIFTS.map((item, i) => {
                const RowIcon = item.Icon
                return (
                  <li key={item.title}>
                    <button
                      type="button"
                      className={`reg-row${i === active ? ' is-active' : ''}`}
                      aria-pressed={i === active}
                      onClick={() => setActive(i)}
                    >
                      <span className="reg-row-icon" aria-hidden="true"><RowIcon /></span>
                      <span className="reg-row-name">{item.title}</span>
                      <span className="reg-row-price">{item.price}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
