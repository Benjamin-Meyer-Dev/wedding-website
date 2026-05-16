import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useHousehold } from '../lib/HouseholdContext.jsx'
import chickenImg from '../assets/Chicken.jpg'
import beefImg from '../assets/Beef.jpg'
import fishImg from '../assets/Fish.jpg'
import vegetarianImg from '../assets/Vegetarian.jpg'
import veganImg from '../assets/Vegan.jpg'
import './rsvp.css'

const IconCheck = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"
       strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 8.5 3 3 7-7" />
  </svg>
)

const IconX = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"
       strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
)

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
        const attending = d.attending ?? null
        return {
          user_id: m.user_id,
          household_id: householdId,
          attending,
          meal_choice: attending === 'yes' ? (d.meal_choice ?? null) : null,
          dietary_notes: attending === 'yes' && d.dietary_notes?.trim() ? d.dietary_notes.trim() : null,
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
      <section className="rsvp">
        <div className="rsvp-shell">
          <p className="rsvp-error">We couldn't find your invitation. Please reach out to Elizabeth or Benjamin.</p>
        </div>
      </section>
    )
  }

  if (householdLoading || rsvpsLoading) {
    return <section className="rsvp" aria-busy="true" />
  }

  if (members.length === 0) {
    return (
      <section className="rsvp">
        <div className="rsvp-shell">
          <p className="rsvp-error">No household members found for your account.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="rsvp">
      <div className="rsvp-shell">
        <header className="rsvp-header">
          <p className="rsvp-eyebrow">
            <span className="rsvp-eyebrow-rule" />
            <span>RSVP</span>
            <span className="rsvp-eyebrow-rule" />
          </p>
          <h1 className="rsvp-title">Will you join us?</h1>
          <p className="rsvp-deadline">Kindly respond by April 1, 2027.</p>
        </header>

        <ul className={`rsvp-list count-${orderedMembers.length}`}>
          {orderedMembers.map((m, idx) => {
            const draft = drafts[m.user_id] ?? emptyDraft()
            const attending = draft.attending
            return (
              <li
                key={m.user_id}
                className={`rsvp-card${attending ? ' is-answered' : ''}`}
                style={{ '--card-index': idx }}
              >
                <h2 className="rsvp-name">{m.first_name}</h2>

                <div className="rsvp-choice" role="radiogroup" aria-label={`${m.first_name}'s response`}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={attending === 'yes'}
                    className={`rsvp-pill${attending === 'yes' ? ' is-on is-yes' : ''}`}
                    onClick={() => setField(m.user_id, 'attending', attending === 'yes' ? null : 'yes')}
                  >
                    <span className="rsvp-pill-icon"><IconCheck /></span>
                    Joyfully Accepts
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={attending === 'no'}
                    className={`rsvp-pill${attending === 'no' ? ' is-on is-no' : ''}`}
                    onClick={() => setField(m.user_id, 'attending', attending === 'no' ? null : 'no')}
                  >
                    <span className="rsvp-pill-icon"><IconX /></span>
                    Regretfully Declines
                  </button>
                </div>

                <div
                  className={`rsvp-extras${attending === 'yes' ? ' is-open' : ''}`}
                  inert={attending !== 'yes' ? '' : undefined}
                >
                  <div className="rsvp-extras-inner">
                    <fieldset className="rsvp-meals">
                      <legend className="rsvp-field-lbl rsvp-menu-label">
                        Choose a meal
                      </legend>
                      <div className="rsvp-meal-grid" role="radiogroup" aria-label={`${m.first_name}'s meal choice`}>
                        {MEAL_OPTIONS.map(({ value, label, desc, image }) => {
                          const selected = draft.meal_choice === value
                          return (
                            <button
                              key={value}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              className={`rsvp-meal-tile${selected ? ' is-on' : ''}${image ? ' has-image' : ''}`}
                              onClick={() => setField(m.user_id, 'meal_choice', selected ? null : value)}
                            >
                              <span
                                className="rsvp-meal-image"
                                style={image ? { backgroundImage: `url(${image})` } : undefined}
                              />
                              <span className="rsvp-meal-veil" />
                              <span className="rsvp-meal-text">
                                <span className="rsvp-meal-lbl">{label}</span>
                                <span className="rsvp-meal-desc">{desc}</span>
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </fieldset>

                    <label className="rsvp-field">
                      <span className="rsvp-field-lbl">Dietary restrictions (optional)</span>
                      <textarea
                        value={draft.dietary_notes}
                        onChange={(e) => setField(m.user_id, 'dietary_notes', e.target.value)}
                        rows={2}
                        maxLength={500}
                        placeholder="Allergies, intolerances, anything we should know"
                      />
                    </label>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        {saveError && (
          <div className="rsvp-status" aria-live="polite">
            <p className="rsvp-error" role="alert">Couldn't save — we'll try again.</p>
          </div>
        )}
      </div>
    </section>
  )
}
