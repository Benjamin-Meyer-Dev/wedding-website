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
          <p className="page-eyebrow rev-fall" style={{ '--rd': '120ms' }}>
            <span className="page-eyebrow-rule" />
            <span>With Love</span>
            <span className="page-eyebrow-rule" />
          </p>
          <h1 className="page-title rev" style={{ '--rd': '220ms' }}>The Registry</h1>
        </header>

        <div className="reg-showcase">
          {/* Featured gift */}
          <div className="reg-feature">
            <div
              className={`reg-stage-photo tone-${active % 3}`}
              key={active}
              style={g.image ? { backgroundImage: `url(${g.image})` } : undefined}
            >
              {!g.image && <span className="reg-stage-icon" aria-hidden="true"><Featured /></span>}
              <span className="reg-price">{g.price}</span>
            </div>
            <div className="reg-feature-foot">
              <h2 className="reg-feature-title" key={`t-${active}`}>{g.title}</h2>
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

          {/* Pick a gift */}
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
    </section>
  )
}
