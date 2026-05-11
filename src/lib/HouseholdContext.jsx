import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const HouseholdContext = createContext(null)

export function HouseholdProvider({ children }) {
  const [household, setHousehold] = useState(null)
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (cancelled) return
        setMember(null)
        setHousehold(null)
        setLoading(false)
        return
      }

      const { data, error: queryError } = await supabase
        .from('household_members')
        .select('user_id, first_name, household_id, households ( id, display_name )')
        .eq('user_id', user.id)
        .maybeSingle()

      if (cancelled) return

      if (queryError) {
        setError(queryError)
        setMember(null)
        setHousehold(null)
      } else if (!data) {
        setError(new Error('User is signed in but has no household membership.'))
        setMember(null)
        setHousehold(null)
      } else {
        setMember({ user_id: data.user_id, first_name: data.first_name })
        setHousehold(data.households)
      }
      setLoading(false)
    }

    load()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setMember(null)
        setHousehold(null)
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
    <HouseholdContext.Provider value={{ household, householdId, member, loading, error }}>
      {children}
    </HouseholdContext.Provider>
  )
}

export function useHousehold() {
  const ctx = useContext(HouseholdContext)
  if (!ctx) throw new Error('useHousehold must be used inside <HouseholdProvider>')
  return ctx
}
