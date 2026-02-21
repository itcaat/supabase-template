'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSupabase } from '@/lib/supabase/context'
import { Sidebar } from '@/components/shared/Sidebar'
import { Skeleton } from '@/components/ui/skeleton'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, currentOrg, loading } = useSupabase()
  const router = useRouter()
  const pathname = usePathname()

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

  if (loading || !user || !profile) {
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
