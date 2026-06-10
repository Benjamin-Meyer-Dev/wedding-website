import { useEffect, useMemo, useRef, useState } from 'react'
import { Check as IconCheck, X as IconX, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useHousehold } from '../lib/HouseholdContext.jsx'
import chickenImg from '../assets/Chicken.jpg'
import beefImg from '../assets/Beef.jpg'
import fishImg from '../assets/Fish.jpg'
import vegetarianImg from '../assets/Vegetarian.jpg'
import veganImg from '../assets/Vegan.jpg'
import './rsvp.css'

// Drop real photos into /public/meals/ (e.g. chicken.jpg) and set the path
// in `image:` below. Until then, each tile shows a tinted placeholder.
const MEAL_OPTIONS = [
  {
    value: 'chicken',
    label: 'Chicken',
    desc: 'Pan-roasted breast with thyme jus, charred lemon, and seasonal vegetables.',
    image: chickenImg,
  },
  {
    value: 'beef',
    label: 'Beef',
    desc: 'Slow-braised short rib with red-wine reduction and creamy parmesan polenta.',
    image: beefImg,
  },
  {
    value: 'fish',
    label: 'Fish',
    desc: 'Cedar-planked salmon with citrus, dill butter, and grilled spring greens.',
    image: fishImg,
  },
  {
    value: 'vegetarian',
    label: 'Vegetarian',
    desc: 'Wild mushroom and root-vegetable wellington with herbed beurre blanc.',
    image: vegetarianImg,
  },
  {
    value: 'vegan',
    label: 'Vegan',
    desc: 'Cauliflower steak with chimichurri, beluga lentils, and charred broccolini.',
    image: veganImg,
  },
]

// Allowed values, mirrored by DB CHECK constraints (migrations/0002_input_hardening.sql).
const MEAL_VALUES = new Set(MEAL_OPTIONS.map((o) => o.value))
const MAX_NOTES = 500

// Defence in depth: the database is the real boundary (a session can hit the
// REST API directly), but we normalise here so only known-good values are sent.
function cleanNotes(value) {
  if (typeof value !== 'string') return null
  // keep tab (9) and newline (10); drop other control characters and DEL (127)
  let out = ''
  for (const ch of value) {
    const code = ch.codePointAt(0)
    if (code === 9 || code === 10 || (code >= 32 && code !== 127)) out += ch
  }
  out = out.trim()
  return out ? out.slice(0, MAX_NOTES) : null
}

function emptyDraft() {
  return { attending: null, meal_choice: null, dietary_notes: '' }
}

export default function Rsvp() {
  const { householdId, members, member, loading: householdLoading, error: householdError } = useHousehold()

  // Show the signed-in user first, then everyone else (the roster from
  // HouseholdContext is already alphabetical, so filtering preserves that).
  const orderedMembers = useMemo(() => {
    if (!member) return members
    const me = members.find((m) => m.user_id === member.user_id)
    if (!me) return members
    return [me, ...members.filter((m) => m.user_id !== member.user_id)]
  }, [members, member])
  const [drafts, setDrafts] = useState({})
  const [initial, setInitial] = useState({})
  const [rsvpsLoading, setRsvpsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [savedAt, setSavedAt] = useState(null)
  const [active, setActive] = useState(0)        // which guest the carousel is showing
  const [previewMeal, setPreviewMeal] = useState(null) // meal whose description is shown
  const swipeRef = useRef(null) // touch start {x, y} for swipe-to-change-card

  useEffect(() => {
    if (householdLoading || !householdId || members.length === 0) return
    let cancelled = false
    setRsvpsLoading(true)
    setSaveError(null)

    supabase
      .from('rsvps')
      .select('user_id, attending, meal_choice, dietary_notes')
      .eq('household_id', householdId)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setSaveError(error)
          setRsvpsLoading(false)
          return
        }
        const next = {}
        for (const m of members) next[m.user_id] = emptyDraft()
        for (const row of data ?? []) {
          next[row.user_id] = {
            attending: row.attending ?? null,
            meal_choice: row.meal_choice ?? null,
            dietary_notes: row.dietary_notes ?? '',
          }
        }
        setInitial(next)
        setDrafts(next)
        setRsvpsLoading(false)
      })

    return () => { cancelled = true }
  }, [householdLoading, householdId, members])

  const isDirty = useMemo(() => {
    for (const id of Object.keys(drafts)) {
      const a = drafts[id]
      const b = initial[id] ?? emptyDraft()
      if (a.attending !== b.attending) return true
      if (a.meal_choice !== b.meal_choice) return true
      if ((a.dietary_notes ?? '') !== (b.dietary_notes ?? '')) return true
    }
    return false
  }, [drafts, initial])

  const setField = (userId, field, value) => {
    setSavedAt(null)
    setDrafts((d) => {
      const next = { ...(d[userId] ?? emptyDraft()), [field]: value }
      if (field === 'attending' && value !== 'yes') {
        next.meal_choice = null
        next.dietary_notes = ''
      }
      return { ...d, [userId]: next }
    })
  }

  // Auto-save: debounce changes by 600ms, then persist silently.
  useEffect(() => {
    if (!isDirty || !householdId) return
    const timer = setTimeout(async () => {
      setSaving(true)
      setSaveError(null)

      const rows = members.map((m) => {
        const d = drafts[m.user_id] ?? emptyDraft()
        // whitelist every value before it leaves the browser
        const attending = d.attending === 'yes' || d.attending === 'no' ? d.attending : null
        const meal = MEAL_VALUES.has(d.meal_choice) ? d.meal_choice : null
        return {
          user_id: m.user_id,
          household_id: householdId,
          attending,
          meal_choice: attending === 'yes' ? meal : null,
          dietary_notes: attending === 'yes' ? cleanNotes(d.dietary_notes) : null,
        }
      })

      const { error } = await supabase
        .from('rsvps')
        .upsert(rows, { onConflict: 'user_id' })

      setSaving(false)
      if (error) {
        setSaveError(error)
        return
      }
      setInitial(drafts)
      setSavedAt(Date.now())
    }, 600)

    return () => clearTimeout(timer)
  }, [drafts, isDirty, householdId, members])

  if (householdError) {
    return (
      <section className="scene rsvp">
        <div className="rsvp-inner">
          <p className="rsvp-error">We couldn't find your invitation. Please reach out to Elizabeth or Benjamin.</p>
        </div>
      </section>
    )
  }

  if (householdLoading || rsvpsLoading) {
    return <section className="scene rsvp" aria-busy="true" />
  }

  if (members.length === 0) {
    return (
      <section className="scene rsvp">
        <div className="rsvp-inner">
          <p className="rsvp-error">No household members found for your account.</p>
        </div>
      </section>
    )
  }

  const total = orderedMembers.length
  const safeActive = Math.min(active, total - 1)
  const go = (delta) => { setPreviewMeal(null); setActive((a) => Math.max(0, Math.min(total - 1, Math.min(a, total - 1) + delta))) }

  // Touch swipe (mobile): a clear horizontal drag flips to the prev/next guest,
  // mirroring the arrows. We never preventDefault, so a vertical drag still
  // scrolls the page; we only act on touch-end when the move is decidedly
  // horizontal and past a small threshold (so taps on buttons aren't swipes).
  const onTouchStart = (e) => {
    if (total <= 1) return
    const t = e.touches[0]
    swipeRef.current = { x: t.clientX, y: t.clientY }
  }
  const onTouchEnd = (e) => {
    const start = swipeRef.current
    swipeRef.current = null
    if (!start || total <= 1) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1)
  }

  return (
    <section className="scene rsvp">
      <div className="rsvp-inner">
        <header className="rsvp-head">
          <h1 className="page-title rev" style={{ '--rd': '150ms' }}>Will you join us?</h1>
          <p className="rsvp-sub rev" style={{ '--rd': '300ms' }}>Kindly respond by April 1, 2027.</p>
        </header>

        <div className="rsvp-deck">
          {total > 1 && (
            <button type="button" className="rsvp-nav" onClick={() => go(-1)} disabled={safeActive === 0} aria-label="Previous guest">
              <ChevronLeft />
            </button>
          )}

          <div className="rsvp-viewport" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <div className="rsvp-track" style={{ transform: `translateX(-${safeActive * 100}%)` }}>
              {orderedMembers.map((mm, i) => {
                const d = drafts[mm.user_id] ?? emptyDraft()
                const att = d.attending
                const isActive = i === safeActive
                return (
                  <div className="rsvp-slide" key={mm.user_id} inert={!isActive ? '' : undefined} aria-hidden={!isActive}>
                    <div className={`rsvp-card${att ? ' is-answered' : ''}`}>
                      <div className="rsvp-card-head">
                        <div className="rsvp-card-who">
                          {total > 1 && <span className="rsvp-count">Guest {i + 1} of {total}</span>}
                          <h2 className="rsvp-name">{mm.first_name}</h2>
                        </div>

                        <div className={`rsvp-toggle rsvp-toggle--${att || 'none'}`} role="radiogroup" aria-label={`${mm.first_name}'s response`}>
                          <span className="rsvp-toggle-thumb" aria-hidden="true" />
                          <button
                            type="button"
                            role="radio"
                            aria-checked={att === 'yes'}
                            className="rsvp-toggle-opt rsvp-toggle-opt--yes"
                            onClick={() => setField(mm.user_id, 'attending', att === 'yes' ? null : 'yes')}
                          >
                            <IconCheck /> Joyfully Accepts
                          </button>
                          <button
                            type="button"
                            role="radio"
                            aria-checked={att === 'no'}
                            className="rsvp-toggle-opt rsvp-toggle-opt--no"
                            onClick={() => setField(mm.user_id, 'attending', att === 'no' ? null : 'no')}
                          >
                            <IconX /> Regretfully Declines
                          </button>
                        </div>
                      </div>

                      <div className={`rsvp-extras${att === 'yes' ? ' is-open' : ''}`} inert={att !== 'yes' ? '' : undefined}>
                        <div className="rsvp-extras-inner">
                          <fieldset className="rsvp-meals">
                            <legend className="rsvp-field-lbl rsvp-menu-label">Choose a meal</legend>
                            <div className="rsvp-meal-grid" role="radiogroup" aria-label={`${mm.first_name}'s meal choice`}>
                              {MEAL_OPTIONS.map(({ value, label, desc, image }) => {
                                const selected = d.meal_choice === value
                                return (
                                  <button
                                    key={value}
                                    type="button"
                                    role="radio"
                                    aria-checked={selected}
                                    className={`rsvp-meal-tile${selected ? ' is-on' : ''}${image ? ' has-image' : ''}`}
                                    onClick={() => setField(mm.user_id, 'meal_choice', selected ? null : value)}
                                    onMouseEnter={() => setPreviewMeal(value)}
                                    onMouseLeave={() => setPreviewMeal(null)}
                                    onFocus={() => setPreviewMeal(value)}
                                    onBlur={() => setPreviewMeal(null)}
                                  >
                                    <span
                                      className="rsvp-meal-image"
                                      style={image ? { backgroundImage: `url(${image})` } : undefined}
                                    />
                                    <span className="rsvp-meal-veil" />
                                    <span className="rsvp-meal-text">
                                      <span className="rsvp-meal-lbl">{label}</span>
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                            {(() => {
                              const cur = MEAL_OPTIONS.find((o) => o.value === (d.meal_choice || previewMeal))
                              return (
                                <p className={`rsvp-meal-caption${cur ? '' : ' is-prompt'}`}>
                                  {cur ? cur.desc : 'Hover a dish for the full description.'}
                                </p>
                              )
                            })()}
                          </fieldset>

                          <label className="rsvp-field">
                            <span className="rsvp-field-lbl">Dietary restrictions (optional)</span>
                            <textarea
                              value={d.dietary_notes}
                              onChange={(e) => setField(mm.user_id, 'dietary_notes', e.target.value)}
                              rows={2}
                              maxLength={500}
                              placeholder="Allergies, intolerances, anything we should know"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {total > 1 && (
            <button type="button" className="rsvp-nav" onClick={() => go(1)} disabled={safeActive === total - 1} aria-label="Next guest">
              <ChevronRight />
            </button>
          )}
        </div>

        {total > 1 && (
          <div className="rsvp-dots" role="tablist" aria-label="Guests">
            {orderedMembers.map((mm, i) => {
              const a = (drafts[mm.user_id] ?? emptyDraft()).attending
              return (
                <button
                  key={mm.user_id}
                  type="button"
                  role="tab"
                  aria-selected={i === safeActive}
                  className={`rsvp-dot${i === safeActive ? ' is-on' : ''}${a ? ' is-done' : ''}`}
                  onClick={() => { setPreviewMeal(null); setActive(i) }}
                  aria-label={`Go to ${mm.first_name}`}
                />
              )
            })}
          </div>
        )}

        <p className="rsvp-savenote" aria-live="polite">
          {saveError ? "Couldn't save. We'll try again." : saving ? 'Saving…' : savedAt ? 'All saved ✓' : ' '}
        </p>
      </div>
    </section>
  )
}
