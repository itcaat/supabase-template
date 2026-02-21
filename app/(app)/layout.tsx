'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSupabase } from '@/lib/supabase/context'
import { Sidebar } from '@/components/shared/Sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

const LOAD_TIMEOUT_MS = 8000

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, currentOrg, loading } = useSupabase()
  const router = useRouter()
  const pathname = usePathname()
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }
    if (profile && !profile.onboarding_completed && pathname !== '/onboarding') {
      router.push('/onboarding')
    }
  }, [user, profile, loading, pathname, router])

  // Show an error if loading takes too long (e.g. missing DB migrations)
  useEffect(() => {
    if (!loading) return
    const t = setTimeout(() => setTimedOut(true), LOAD_TIMEOUT_MS)
    return () => clearTimeout(t)
  }, [loading])

  if (loading || !user || !profile) {
    if (timedOut) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 text-center p-8">
          <p className="text-sm font-medium">Failed to load your account.</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            This usually means the database migrations haven&apos;t been applied yet.<br />
            Run <code className="bg-muted px-1 rounded">make db-push</code> then sign out and back in.
          </p>
          <Button variant="outline" size="sm" onClick={() => router.push('/login')}>
            Back to login
          </Button>
        </div>
      )
    }

    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
