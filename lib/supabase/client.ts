import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Store the singleton on globalThis so it survives Turbopack/webpack HMR
// module re-evaluation in development. Without this, each hot reload creates
// a new SupabaseClient that fights the previous one for the navigator lock.
const g = globalThis as typeof globalThis & { __supabase?: SupabaseClient }

export function createClient(): SupabaseClient {
  if (!g.__supabase) {
    g.__supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return g.__supabase
}
