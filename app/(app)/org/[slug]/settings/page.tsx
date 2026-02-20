import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrgSettingsForm } from '@/components/organizations/OrgSettingsForm'
import { DangerZone } from '@/components/organizations/DangerZone'
import { canDo } from '@/lib/rbac'
import type { MemberRole } from '@/types'

interface Props {
  params: Promise<{ slug: string }>
}

export const metadata = { title: 'Organization settings' }

export default async function OrgSettingsPage({ params }: Props) {
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
  const canEdit = canDo(currentUserRole, 'manage_org')
  const isOwner = currentUserRole === 'owner'

  return (
    <div className="p-8 max-w-2xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Organization settings</h1>
        <p className="text-muted-foreground text-sm mt-1">{org.name}</p>
      </div>

      <OrgSettingsForm org={org} canEdit={canEdit} />

      {isOwner && (
        <DangerZone orgId={org.id} orgName={org.name} isPersonal={org.type === 'personal'} />
      )}
    </div>
  )
}
