'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useSupabase } from '@/lib/supabase/context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DangerZoneProps {
  orgId: string
  orgName: string
  isPersonal: boolean
}

export function DangerZone({ orgId, orgName, isPersonal }: DangerZoneProps) {
  const { supabase, refreshOrgs } = useSupabase()
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  if (isPersonal) {
    return (
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive text-sm">Danger zone</CardTitle>
          <CardDescription>Personal workspaces cannot be deleted.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${orgName}"? This cannot be undone. All projects, members and data will be permanently removed.`)) return
    setIsPending(true)
    const { error } = await supabase.from('organizations').delete().eq('id', orgId)
    if (error) { toast.error(error.message); setIsPending(false); return }
    toast.success('Organization deleted')
    await refreshOrgs()
    router.push('/dashboard')
  }

  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <CardTitle className="text-destructive text-sm">Danger zone</CardTitle>
        <CardDescription>Permanently delete this organization and all its data.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
          {isPending ? 'Deleting…' : 'Delete organization'}
        </Button>
      </CardContent>
    </Card>
  )
}
