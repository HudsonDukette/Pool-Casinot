// Lazy-load the Supabase ESM package at runtime so the main bundle can attach UI handlers
let _supabase = null

async function resolveKeys() {
  const url = (
    window?.NEXT_PUBLIC_SUPABASE_URL ||
    (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_SUPABASE_URL) ||
    document.querySelector('meta[name="supabase-url"]')?.getAttribute('content') ||
    ''
  )
  const anon = (
    window?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    document.querySelector('meta[name="supabase-anon-key"]')?.getAttribute('content') ||
    ''
  )
  return { url, anon }
}

export async function getSupabase() {
  if (_supabase) return _supabase
  const { url, anon } = await resolveKeys()
  try {
    const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm')
    const { createClient } = mod
    if (!url || !anon) {
      // runtime hint only
      // eslint-disable-next-line no-console
      console.warn('Supabase keys not found. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.')
    }
    _supabase = createClient(url, anon, { auth: { persistSession: true, detectSessionInUrl: true } })
    return _supabase
  } catch (err) {
    // If network load of the CDN fails, surface a helpful error but don't crash the app during module parse.
    // eslint-disable-next-line no-console
    console.error('Failed to load Supabase client:', err)
    throw err
  }
}

export default getSupabase
