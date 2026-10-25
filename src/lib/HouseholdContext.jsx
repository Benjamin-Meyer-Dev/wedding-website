import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './Supabase'

const HouseholdContext = createContext(null)

// One login per household (migration 0008): the signed-in auth user IS the
// household, and `guests` are the people invited under it.
export function HouseholdProvider({ children }) {
  const [household, setHousehold] = useState(null)
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // The user id the household was (or is being) loaded for. auth-js re-emits
  // SIGNED_IN every time the tab becomes visible again, plus TOKEN_REFRESHED
  // hourly; reloading on each one cost three round trips (getUser, households,
  // then Rsvp's rsvps refetch off the new `guests` array), blanked the RSVP
  // deck behind `loading`, and could overwrite edits still inside its autosave
  // debounce. Only a different user needs a fetch.
  const loadedFor = useRef(null)

  useEffect(() => {
    let cancelled = false

    const reset = () => {
      setHousehold(null)
      setGuests([])
    }

    // userId comes from the local session (getSession / the auth event), not
    // getUser(), which is a network round trip; RLS still scopes the query.
    async function load(userId) {
      if (!userId) {
        loadedFor.current = null
        reset()
        setLoading(false)
        return
      }
      if (loadedFor.current === userId) return
      // Claimed before the await, so the getSession() call and the SIGNED_IN
      // that auth-js fires during startup don't both fetch.
      loadedFor.current = userId
      setLoading(true)
      setError(null)

      const { data, error: qError } = await supabase
        .from('households')
        .select('id, display_name, guests ( id, first_name )')
        .eq('user_id', userId)
        .maybeSingle()

      if (cancelled) return

      if (qError || !data) {
        loadedFor.current = null // let the next auth event retry
        setError(qError ?? new Error('Signed in, but no household is linked to this login.'))
        reset()
      } else {
        const { guests: roster, ...rest } = data
        setHousehold(rest)
        // alphabetical by first name: RSVP cards, greetings
        setGuests([...(roster ?? [])].sort((a, b) => a.first_name.localeCompare(b.first_name)))
      }
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => load(data.session?.user?.id))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        loadedFor.current = null
        reset()
        setError(null)
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        load(session?.user?.id)
      }
    })

    return () => {
      cancelled = true
      // an in-flight load dies with `cancelled`, so release its claim (StrictMode
      // remounts straight away and must be free to fetch again)
      loadedFor.current = null
      subscription.unsubscribe()
    }
  }, [])

  const householdId = household?.id ?? null
  const value = useMemo(
    () => ({ household, householdId, guests, loading, error }),
    [household, householdId, guests, loading, error],
  )

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  )
}

export function useHousehold() {
  const ctx = useContext(HouseholdContext)
  if (!ctx) throw new Error('useHousehold must be used inside <HouseholdProvider>')
  return ctx
}

// "Anna", "Anna & Tom", "Anna, Tom & Sam"
export function joinNames(guests) {
  const names = guests.map((g) => g.first_name).filter(Boolean)
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`
}
