import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './Supabase'

const HouseholdContext = createContext(null)

// One login per household (migration 0008): the signed-in auth user IS the
// household, and `guests` are the people invited under it.
export function HouseholdProvider({ children }) {
  const [household, setHousehold] = useState(null)
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    const reset = () => {
      setHousehold(null)
      setGuests([])
    }

    async function load() {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (cancelled) return
        reset()
        setLoading(false)
        return
      }

      const { data, error: qError } = await supabase
        .from('households')
        .select('id, display_name, guests ( id, first_name )')
        .eq('user_id', user.id)
        .maybeSingle()

      if (cancelled) return

      if (qError || !data) {
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

    load()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        reset()
        setError(null)
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        load()
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const householdId = household?.id ?? null

  return (
    <HouseholdContext.Provider value={{ household, householdId, guests, loading, error }}>
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
