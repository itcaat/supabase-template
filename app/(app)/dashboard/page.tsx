'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/supabase/context'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardPage() {
  const { currentOrg, loading } = useSupabase()
  const router = useRouter()

  useEffect(() => {
    if (!loading && currentOrg) {
      router.replace(`/org/${currentOrg.slug}`)
    }
  }, [currentOrg, loading, router])

  return (
    <div className="flex h-full items-center justify-center">
      <div className="space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  )
}
