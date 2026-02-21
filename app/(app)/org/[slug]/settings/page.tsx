'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSupabase } from '@/lib/supabase/context'
import { OrgSettingsForm } from '@/components/organizations/OrgSettingsForm'
import { DangerZone } from '@/components/organizations/DangerZone'
import { Skeleton } from '@/components/ui/skeleton'
import { canDo } from '@/lib/rbac'
import type { MemberRole, Organization } from '@/types'

export default function OrgSettingsPage() {
  const { slug } = useParams<{ slug: string }>()
  const { supabase, user } = useSupabase()
  const [org, setOrg] = useState<Organization | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<MemberRole>('viewer')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !slug) return
    const load = async () => {
      const [{ data: orgData }, { data: membership }] = await Promise.all([
        supabase.from('organizations').select('*').eq('slug', slug).single(),
        supabase.from('organization_members').select('role').eq('user_id', user.id).single(),
      ])
      setOrg(orgData)
      setCurrentUserRole((membership?.role ?? 'viewer') as MemberRole)
      setLoading(false)
    }
    load()
  }, [slug, user, supabase])

  if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-48" /></div>
  if (!org) return <div className="p-8 text-muted-foreground">Organization not found.</div>

  const canEdit = canDo(currentUserRole, 'manage_org')
  const isOwner = currentUserRole === 'owner'

  return (
    <div className="p-8 max-w-2xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Organization settings</h1>
        <p className="text-muted-foreground text-sm mt-1">{org.name}</p>
      </div>
      <OrgSettingsForm org={org} canEdit={canEdit} />
      {isOwner && <DangerZone orgId={org.id} orgName={org.name} isPersonal={org.type === 'personal'} />}
    </div>
  )
}
