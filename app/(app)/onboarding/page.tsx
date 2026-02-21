'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/supabase/context'
import { WizardShell } from '@/components/onboarding/WizardShell'
import { Skeleton } from '@/components/ui/skeleton'

export default function OnboardingPage() {
  const { user, profile, organizations, loading } = useSupabase()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
    if (!loading && profile?.onboarding_completed) router.push('/dashboard')
  }, [user, profile, loading, router])

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    )
  }

  const personalOrg = organizations.find((o) => o.type === 'personal') ?? organizations[0]

  if (!personalOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Setting up your account… please wait.</p>
      </div>
    )
  }

  return <WizardShell personalOrg={personalOrg} />
}
