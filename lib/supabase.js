import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Try multiple places where env keys might be available at runtime.
const SUPABASE_URL = (
  window?.NEXT_PUBLIC_SUPABASE_URL ||
  (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_SUPABASE_URL) ||
  document.querySelector('meta[name="supabase-url"]')?.getAttribute('content') ||
  ''
)

const SUPABASE_ANON_KEY = (
  window?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  document.querySelector('meta[name="supabase-anon-key"]')?.getAttribute('content') ||
  ''
)

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Friendly runtime hint; do not throw so the UI can still load for local dev without keys.
  // When deploying to Vercel, set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
  // eslint-disable-next-line no-console
  console.warn('Supabase keys not found. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, detectSessionInUrl: true },
})

export default supabase
