import { useEffect, useState } from 'react'
import { Plane, CookingPot, Cake, BedDouble, Wine, Coffee, ArrowRight, Check, Heart } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useHousehold } from '../lib/HouseholdContext.jsx'
import honeymoonPhoto from '../assets/honeymoon.jpg'
import './registry.css'

// Rough items. For each: set `price`, a real `link` (Buy Now destination), and
// optionally an `image` URL (product photo) — until then a themed panel shows.
// `key` identifies the item in registry_purchases (migrations/0004) — keep it
// stable once guests start marking purchases. `fund: true` means many
// households can mark a contribution; without it the first claim shows the
// gift as taken for everyone.
const GIFTS = [
  { key: 'honeymoon-fund',   Icon: Plane,      title: 'Honeymoon Fund',        price: 'Any amount', link: '#', cta: 'Contribute', image: honeymoonPhoto, fund: true },
  { key: 'dutch-oven',       Icon: CookingPot, title: 'Enamel Dutch Oven',     price: '$380',       link: '#', cta: 'Buy Now',    image: '' },
  { key: 'stand-mixer',      Icon: Cake,       title: 'Stand Mixer',           price: '$430',       link: '#', cta: 'Buy Now',    image: '' },
  { key: 'linen-bedding',    Icon: BedDouble,  title: 'Linen Bedding Set',     price: '$220',       link: '#', cta: 'Buy Now',    image: '' },
  { key: 'wine-decanter',    Icon: Wine,       title: 'Crystal Wine Decanter', price: '$85',        link: '#', cta: 'Buy Now',    image: '' },
  { key: 'espresso-machine', Icon: Coffee,     title: 'Espresso Machine',      price: '$600',       link: '#', cta: 'Buy Now',    image: '' },
]

export default function Registry() {
  const { householdId, member } = useHousehold()
  const [active, setActive] = useState(0)
  // every household's marks: [{ item_key, household_id }] — guests self-report,
  // so this only reflects what people chose to tell us
  const [purchases, setPurchases] = useState([])
  const [claimBusy, setClaimBusy] = useState(false)
  const [claimError, setClaimError] = useState(false)

  useEffect(() => {
    if (!householdId) return
    let cancelled = false

    const load = async () => {
      const { data, error } = await supabase
        .from('registry_purchases')
        .select('item_key, household_id')
      if (!cancelled && !error) setPurchases(data ?? [])
    }
    load()

    // Live updates over Supabase Realtime (its built-in websocket): any
    // insert/delete by another guest re-reads the list, so a gift marked on
    // one phone shows as taken on every other open page within a second or
    // two and nobody double-buys. We refetch instead of patching state from
    // the event payload: it is simpler and self-heals if an event is missed.
    // Requires the table in the supabase_realtime publication (migration 0005).
    const channel = supabase
      .channel('registry-purchases')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registry_purchases' }, load)
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [householdId])

  const minePurchased = (key) => purchases.some((p) => p.item_key === key && p.household_id === householdId)
  const anyPurchased = (key) => purchases.some((p) => p.item_key === key)
  // 'mine' | 'other' | null — funds only ever count YOUR contribution (other
  // households contributing never blocks or labels the item for you)
  const purchaseState = (item) => {
    if (minePurchased(item.key)) return 'mine'
    if (!item.fund && anyPurchased(item.key)) return 'other'
    return null
  }

  const refreshPurchases = async () => {
    const { data } = await supabase.from('registry_purchases').select('item_key, household_id')
    setPurchases(data ?? [])
  }

  const mark = async (gift) => {
    if (!householdId || claimBusy) return
    setClaimBusy(true)
    setClaimError(false)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('registry_purchases')
      .insert({ item_key: gift.key, household_id: householdId, user_id: user?.id })
    // refresh either way — a unique-key conflict just means our own mark already
    // exists (double tap), and the fresh read shows the true state
    await refreshPurchases()
    if (error && error.code !== '23505') setClaimError(true)
    setClaimBusy(false)
  }

  const unmark = async (gift) => {
    if (!householdId || claimBusy) return
    setClaimBusy(true)
    setClaimError(false)
    const { error } = await supabase
      .from('registry_purchases')
      .delete()
      .eq('item_key', gift.key)
      .eq('household_id', householdId)
    await refreshPurchases()
    if (error) setClaimError(true)
    setClaimBusy(false)
  }

  const g = GIFTS[active]
  const Featured = g.Icon
  const gState = purchaseState(g)

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
              {/* status pill opposite the price: yours is warm, another guest's is quiet */}
              {gState === 'mine' && <span className="reg-flag reg-flag--mine"><Heart /> {g.fund ? 'You contributed' : 'Purchased by you'}</span>}
              {gState === 'other' && <span className="reg-flag">Already purchased</span>}
              <span className="reg-price">{g.price}</span>
              <div className="reg-stage-foot">
                <div className="reg-stage-foot-main">
                  <h2 className="reg-feature-title">{g.title}</h2>
                  <a
                    className="reg-buy"
                    href={g.link}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => { if (g.link === '#') e.preventDefault() }}
                  >
                    {g.cta} <ArrowRight />
                  </a>
                </div>

                {/* Self-reported purchase ribbon: the whole strip is the
                    toggle (tap to mark, tap again to undo). Buying happens on
                    the store's site, so guests tell us here. The three faces
                    stack in one grid cell and the state CLASSES transition
                    (no remount): the accent fill sweeps in on mark and
                    recedes on undo, so both directions animate. */}
                {householdId && (
                  <button
                    type="button"
                    className={`reg-ribbon${gState === 'mine' ? ' is-mine' : ''}${gState === 'other' ? ' is-other' : ''}`}
                    disabled={gState === 'other'}
                    onClick={() => { if (gState === 'mine') unmark(g); else if (!gState) mark(g) }}
                    aria-label={
                      gState === 'mine'
                        ? 'Marked as purchased. Activate to undo.'
                        : gState === 'other'
                          ? 'Already purchased by another guest.'
                          : g.fund ? 'Mark as contributed' : 'Mark as purchased'
                    }
                  >
                    <span className="reg-ribbon-face reg-ribbon-face--open" aria-hidden="true">
                      <Check />
                      {claimError
                        ? 'Couldn’t save. Tap to try again.'
                        : g.fund
                          ? 'Already contributed? Tap to let us know'
                          : 'Bought this gift? Tap to mark it purchased'}
                    </span>
                    <span className="reg-ribbon-face reg-ribbon-face--mine" aria-hidden="true">
                      <Heart />
                      Thank you{member?.first_name ? `, ${member.first_name}` : ''}! Tap anytime to undo.
                    </span>
                    <span className="reg-ribbon-face reg-ribbon-face--other" aria-hidden="true">
                      <Check />
                      Already purchased by another guest. Thank you!
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Pick a gift — the list scrolls within the feature's height so the
              main (featured) area stays fully in frame no matter how many items. */}
          <div className="reg-list-wrap">
            <ul className="reg-list" aria-label="Registry items">
              {GIFTS.map((item, i) => {
                const RowIcon = item.Icon
                const st = purchaseState(item)
                return (
                  <li key={item.title}>
                    <button
                      type="button"
                      className={`reg-row${i === active ? ' is-active' : ''}${st ? ' is-done' : ''}${st === 'mine' ? ' is-mine' : ''}`}
                      aria-pressed={i === active}
                      onClick={() => setActive(i)}
                    >
                      <span className="reg-row-icon" aria-hidden="true">
                        <RowIcon />
                        {st === 'mine' && <span className="reg-row-done reg-row-done--mine"><Heart /></span>}
                        {st === 'other' && <span className="reg-row-done"><Check /></span>}
                      </span>
                      <span className="reg-row-text">
                        <span className="reg-row-name">{item.title}</span>
                        <span className="reg-row-price">
                          {st === 'mine' ? (item.fund ? 'You contributed' : 'Purchased by you') : st === 'other' ? 'Purchased' : item.price}
                        </span>
                      </span>
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
