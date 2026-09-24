import { createClient } from '@supabase/supabase-js'
import { AUTH_STORAGE_KEY, dropSessionIfAway } from './IdleLogout.js'

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
