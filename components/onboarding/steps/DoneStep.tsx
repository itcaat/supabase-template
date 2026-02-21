'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { useSupabase } from '@/lib/supabase/context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { OrgWithRole } from '@/lib/supabase/context'

interface DoneStepProps { org: OrgWithRole }

export function DoneStep({ org }: DoneStepProps) {
  const { supabase, user, refreshProfile, refreshOrgs, setCurrentOrg } = useSupabase()
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const handleFinish = async () => {
    if (!user) return
    setIsPending(true)
    await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id)
    await Promise.all([refreshProfile(), refreshOrgs()])
    setCurrentOrg(org)
    router.push(`/org/${org.slug}`)
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </div>
        <CardTitle className="text-2xl">You&apos;re all set!</CardTitle>
        <CardDescription>
          <strong>{org.name}</strong> is ready to go.
        </CardDescription>
      </CardHeader>
      <CardContent />
      <CardFooter>
        <Button className="w-full" onClick={handleFinish} disabled={isPending}>
          {isPending ? 'Loading…' : 'Go to dashboard'}
        </Button>
      </CardFooter>
    </Card>
  )
}
