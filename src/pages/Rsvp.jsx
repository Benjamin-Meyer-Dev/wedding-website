import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useHousehold } from '../lib/HouseholdContext.jsx'
import './rsvp.css'

const RSVP_DEADLINE = 'PLEASE RESPOND BY APRIL 1, 2027'

const IconChicken = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 4.5C5.7 4.5 3.6 6.8 3.6 9.6c0 1.4.6 2.6 1.7 3.4.5.4.8.8.8 1.4 0 .7-.4 1.1-1 1.5-.9.6-1.6 1.2-1.6 2.4 0 .9.7 1.5 1.7 1.5 1.4 0 2.8-.8 3.4-2 .3-.7.8-1.1 1.7-1.1 2.9 0 5.2-2.3 5.2-5.2 0-3.7-2.9-7-7-7Z" />
    <path d="m13 14 5 5M15 14l3-1" />
  </svg>
)

const IconBeef = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5.5 8.5c.6-2.5 3-4 6-4s5.5 1.5 6.5 4 .8 5-.5 7-3.5 3-6.5 3-5.5-1-6.5-3-.5-5 .5-7Z" />
    <circle cx="10.5" cy="10.5" r="1.4" />
    <path d="M10.5 11.9V15M13 14l1.5 1" />
  </svg>
)

const IconFish = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12c2-3.5 5.5-5.5 9-5.5 3 0 5.5 1.6 7 4-1.5 2.4-4 4-7 4-3.5 0-7-1.7-9-2.5Z" />
    <path d="M4 12c-.8-.5-1.5-1.5-1.5-2.5M4 12c-.8.5-1.5 1.5-1.5 2.5" />
    <circle cx="16" cy="10.5" r=".7" fill="currentColor" />
    <path d="M11.5 9c.6 1.4.6 4.6 0 6" />
  </svg>
)

const IconLeaf = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 19c0-7.7 6.3-14 14-14 0 7.7-6.3 14-14 14Z" />
    <path d="M5 19c4-4.5 8.5-9 14-14" />
  </svg>
)

const IconSprout = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20v-7" />
    <path d="M12 13C9 13 6 11 6 7c4 0 6 2 6 6Z" />
    <path d="M12 13c3 0 6-2 6-6-4 0-6 2-6 6Z" />
  </svg>
)

// Drop real photos into /public/meals/ (e.g. chicken.jpg) and add the
// path to `image:` below. Until then, the line illustration shows.
const MEAL_OPTIONS = [
  { value: 'chicken',    label: 'Chicken',    Icon: IconChicken, image: null },
  { value: 'beef',       label: 'Beef',       Icon: IconBeef,    image: null },
  { value: 'fish',       label: 'Fish',       Icon: IconFish,    image: null },
  { value: 'vegetarian', label: 'Vegetarian', Icon: IconLeaf,    image: null },
  { value: 'vegan',      label: 'Vegan',      Icon: IconSprout,  image: null },
]

function emptyDraft() {
  return { attending: null, meal_choice: null, dietary_notes: '' }
}

export default function Rsvp() {
  const { householdId, members, loading: householdLoading, error: householdError } = useHousehold()
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

  const handleSave = async () => {
    if (!householdId || saving) return
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
  }

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
          <p className="eyebrow">
            <span className="rule short" />
            <span>RSVP</span>
            <span className="rule short" />
          </p>
          <h1 className="rsvp-title">Will you join us?</h1>
          <p className="rsvp-deadline">{RSVP_DEADLINE}</p>
        </header>

        <ul className={`rsvp-list count-${members.length}`}>
          {members.map((m) => {
            const draft = drafts[m.user_id] ?? emptyDraft()
            const attending = draft.attending
            return (
              <li key={m.user_id} className={`rsvp-card${attending ? ' is-answered' : ''}`}>
                <h2 className="rsvp-name">{m.first_name}</h2>

                <div className="rsvp-choice" role="radiogroup" aria-label={`${m.first_name}'s response`}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={attending === 'yes'}
                    className={`rsvp-pill${attending === 'yes' ? ' is-on is-yes' : ''}`}
                    onClick={() => setField(m.user_id, 'attending', attending === 'yes' ? null : 'yes')}
                  >
                    Joyfully Accepts
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={attending === 'no'}
                    className={`rsvp-pill${attending === 'no' ? ' is-on is-no' : ''}`}
                    onClick={() => setField(m.user_id, 'attending', attending === 'no' ? null : 'no')}
                  >
                    Regretfully Declines
                  </button>
                </div>

                {attending === 'yes' && (
                  <div className="rsvp-extras">
                    <fieldset className="rsvp-meals">
                      <legend className="rsvp-field-lbl">Choose a meal</legend>
                      <div className="rsvp-meal-grid" role="radiogroup" aria-label={`${m.first_name}'s meal choice`}>
                        {MEAL_OPTIONS.map(({ value, label, Icon, image }) => {
                          const selected = draft.meal_choice === value
                          return (
                            <button
                              key={value}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              className={`rsvp-meal-tile${selected ? ' is-on' : ''}`}
                              onClick={() => setField(m.user_id, 'meal_choice', selected ? null : value)}
                            >
                              <span
                                className={`rsvp-meal-image${image ? ' has-image' : ''}`}
                                style={image ? { backgroundImage: `url(${image})` } : undefined}
                              >
                                {!image && <Icon />}
                              </span>
                              <span className="rsvp-meal-lbl">{label}</span>
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
                )}
              </li>
            )
          })}
        </ul>

        <div className="rsvp-actions">
          {saveError && <p className="rsvp-error" role="alert">Couldn't save — please try again.</p>}
          {savedAt && !isDirty && <p className="rsvp-saved">Saved.</p>}
          <button
            type="button"
            className="rsvp-save"
            onClick={handleSave}
            disabled={!isDirty || saving}
          >
            {saving ? 'Saving…' : 'Save Response'}
          </button>
        </div>
      </div>
    </section>
  )
}
