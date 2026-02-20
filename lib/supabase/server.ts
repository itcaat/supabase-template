import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Server component — cookies can only be set in middleware or route handlers
          }
        },
      },
    },
  )
}

// createServiceClient() is intentionally omitted from this template.
// If you need to bypass RLS for admin tasks (e.g. background jobs, webhooks),
// create a service client with SUPABASE_SERVICE_ROLE_KEY only in that specific
// server-only file — never expose the key to the browser or commit it to git.
