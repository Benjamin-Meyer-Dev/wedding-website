import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const HouseholdContext = createContext(null)

export function HouseholdProvider({ children }) {
  const [household, setHousehold] = useState(null)
  const [members, setMembers] = useState([])
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
        setMembers([])
        setHousehold(null)
        setLoading(false)
        return
      }

      const { data: mine, error: meError } = await supabase
        .from('household_members')
        .select('user_id, first_name, household_id, households ( id, display_name )')
        .eq('user_id', user.id)
        .maybeSingle()

      if (cancelled) return

      if (meError) {
        setError(meError)
        setMember(null)
        setMembers([])
        setHousehold(null)
        setLoading(false)
        return
      }
      if (!mine) {
        setError(new Error('User is signed in but has no household membership.'))
        setMember(null)
        setMembers([])
        setHousehold(null)
        setLoading(false)
        return
      }

      const { data: roster, error: rosterError } = await supabase
        .from('household_members')
        .select('user_id, first_name')
        .eq('household_id', mine.household_id)
        .order('first_name', { ascending: true })

      if (cancelled) return

      if (rosterError) {
        setError(rosterError)
        setMember(null)
        setMembers([])
        setHousehold(null)
      } else {
        setMember({ user_id: mine.user_id, first_name: mine.first_name })
        setMembers(roster ?? [])
        setHousehold(mine.households)
      }
      setLoading(false)
    }

    load()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setMember(null)
        setMembers([])
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
    <HouseholdContext.Provider value={{ household, householdId, member, members, loading, error }}>
      {children}
    </HouseholdContext.Provider>
  )
}

export function useHousehold() {
  const ctx = useContext(HouseholdContext)
  if (!ctx) throw new Error('useHousehold must be used inside <HouseholdProvider>')
  return ctx
}
