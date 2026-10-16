import { createClient } from '@supabase/supabase-js'
import { AUTH_STORAGE_KEY, dropSessionIfAway } from './IdleLogout.js'
import { forgetPassword } from './RememberedPassword.js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase env vars missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local'
  )
}

// Before the client reads its stored session: a guest who has been away past
// the limit starts signed out (see IdleLogout.js).
dropSessionIfAway()

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storageKey: AUTH_STORAGE_KEY },
})

// however the session ends (Sign Out, idle logout), drop the remembered password
supabase.auth.onAuthStateChange((event) => { if (event === 'SIGNED_OUT') forgetPassword() })

// Checks a password without touching the signed-in session: a throwaway,
// storage-less client signs in on the side, so the main client fires no auth
// events (which would reload the household and flash the page).
export async function verifyPassword(email, password) {
  const probe = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, storageKey: 'eb-verify' },
  })
  const { error } = await probe.auth.signInWithPassword({ email, password })
  return !error
}
