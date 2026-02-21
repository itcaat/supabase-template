'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSupabase } from '@/lib/supabase/context'
import { MemberTable } from '@/components/organizations/MemberTable'
import { InviteForm } from '@/components/organizations/InviteForm'
import { InviteTable } from '@/components/organizations/InviteTable'
import { Skeleton } from '@/components/ui/skeleton'
import { canDo } from '@/lib/rbac'
import { isTeamsMode } from '@/lib/config'
import type { Invitation, MemberRole, OrganizationMember, Profile } from '@/types'

interface MemberWithProfile extends OrganizationMember { profile: Profile }

export default function MembersPage() {
  const { slug } = useParams<{ slug: string }>()
  const { supabase, user } = useSupabase()
  const [org, setOrg] = useState<{ id: string; name: string } | null>(null)
  const [members, setMembers] = useState<MemberWithProfile[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<MemberRole>('viewer')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user || !slug) return
    const { data: orgData } = await supabase.from('organizations').select('id,name').eq('slug', slug).single()
    if (!orgData) return
    setOrg(orgData)

    const [{ data: membersData }, { data: invData }, { data: myMembership }] = await Promise.all([
      supabase.from('organization_members').select('*, profile:profiles(*)').eq('org_id', orgData.id).order('created_at'),
      supabase.from('invitations').select('*').eq('org_id', orgData.id).is('accepted_at', null).gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }),
      supabase.from('organization_members').select('role').eq('org_id', orgData.id).eq('user_id', user.id).single(),
    ])

    setMembers((membersData ?? []) as unknown as MemberWithProfile[])
    setInvitations(invData ?? [])
    setCurrentUserRole((myMembership?.role ?? 'viewer') as MemberRole)
    setLoading(false)
  }, [slug, user, supabase])

  useEffect(() => { load() }, [load])

  const teamsMode = isTeamsMode()
  const canInvite = canDo(currentUserRole, 'invite_members') && teamsMode

  if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-8 w-32" /><Skeleton className="h-48" /></div>
  if (!org) return <div className="p-8 text-muted-foreground">Organization not found.</div>

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Members</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage who has access to <strong>{org.name}</strong>
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Team ({members.length})
        </h2>
        <MemberTable
          members={members}
          orgId={org.id}
          currentUserId={user!.id}
          currentUserRole={currentUserRole}
          onMutate={load}
        />
      </section>

      {teamsMode && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Pending invitations
          </h2>
          {canInvite && <InviteForm orgId={org.id} onMutate={load} />}
          <InviteTable invitations={invitations} canManage={canInvite} onMutate={load} />
        </section>
      )}
    </div>
  )
}
