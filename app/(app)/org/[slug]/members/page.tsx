import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MemberTable } from '@/components/organizations/MemberTable'
import { InviteForm } from '@/components/organizations/InviteForm'
import { InviteTable } from '@/components/organizations/InviteTable'
import { canDo } from '@/lib/rbac'
import { isTeamsMode } from '@/lib/config'
import type { MemberRole, OrganizationMember, Profile } from '@/types'

interface Props {
  params: Promise<{ slug: string }>
}

export const metadata = { title: 'Members' }

export default async function MembersPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single()
  if (!org) notFound()

  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('org_id', org.id)
    .eq('user_id', user.id)
    .single()
  if (!membership) notFound()

  const currentUserRole = membership.role as MemberRole

  // Fetch members with profiles
  const { data: membersData } = await supabase
    .from('organization_members')
    .select('*, profile:profiles(*)')
    .eq('org_id', org.id)
    .order('created_at', { ascending: true })

  const members = (membersData ?? []) as unknown as (OrganizationMember & { profile: Profile })[]

  // Fetch pending invitations
  const { data: invitations } = await supabase
    .from('invitations')
    .select('*')
    .eq('org_id', org.id)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  const teamsMode = isTeamsMode()
  const canInvite = canDo(currentUserRole, 'invite_members') && teamsMode

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
          currentUserId={user.id}
          currentUserRole={currentUserRole}
        />
      </section>

      {teamsMode && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Pending invitations
          </h2>
          {canInvite && (
            <InviteForm orgId={org.id} />
          )}
          <InviteTable
            invitations={invitations ?? []}
            canManage={canInvite}
          />
        </section>
      )}
    </div>
  )
}
