// The household's password, kept from sign-in so Settings can show it in the
// "Current password" field (Supabase only stores a hash, so it can't be read
// back later). sessionStorage, not localStorage: it lives only as long as this
// tab, never touches disk past that, and is wiped on sign-out / idle logout
// (Supabase.js, IdleLogout.js). A tab without it just shows the field empty.
const KEY = 'eb:pw'

export const rememberPassword = (pw) => { try { sessionStorage.setItem(KEY, pw) } catch {} }
export const forgetPassword = () => { try { sessionStorage.removeItem(KEY) } catch {} }
export function recallPassword() {
  try {
    return sessionStorage.getItem(KEY) ?? ''
  } catch {
    return '' // storage blocked — the guest types it instead
  }
}
