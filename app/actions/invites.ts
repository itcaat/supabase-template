'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { sendInviteEmail } from '@/lib/invites'
import type { MemberRole } from '@/types'

export async function createInvitation(
  orgId: string,
  email: string,
  role: MemberRole,
  projectId?: string,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check for existing pending invitation
  const { data: existing } = await supabase
    .from('invitations')
    .select('id, accepted_at, expires_at')
    .eq('org_id', orgId)
    .eq('email', email)
    .is('accepted_at', null)
    .maybeSingle()

  if (existing && new Date(existing.expires_at) > new Date()) {
    return { error: 'A pending invitation already exists for this email' }
  }

  const insertData: {
    org_id: string
    email: string
    role: MemberRole
    invited_by: string
    project_id?: string
  } = {
    org_id: orgId,
    email,
    role,
    invited_by: user.id,
  }
  if (projectId) insertData.project_id = projectId

  const { data: invitation, error } = await supabase
    .from('invitations')
    .insert(insertData)
    .select()
    .single()

  if (error) return { error: error.message }

  // Get org and inviter info for the email
  const [{ data: org }, { data: profile }] = await Promise.all([
    supabase.from('organizations').select('name').eq('id', orgId).single(),
    supabase.from('profiles').select('full_name, email').eq('id', user.id).single(),
  ])

  let projectName: string | undefined
  if (projectId) {
    const { data: proj } = await supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single()
    projectName = proj?.name
  }

  await sendInviteEmail({
    to: email,
    inviterName: profile?.full_name ?? profile?.email ?? 'Someone',
    orgName: org?.name ?? 'the organization',
    projectName,
    role,
    token: invitation.token,
  })

  revalidatePath('/org')
  return { success: true }
}

export async function revokeInvitation(invitationId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', invitationId)

  if (error) return { error: error.message }

  revalidatePath('/org')
  return { success: true }
}

export async function acceptInvitation(token: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Redirect to signup with token
    redirect(`/signup?invite=${token}`)
  }

  const { data, error } = await supabase.rpc('accept_invitation', {
    invitation_token: token,
  })

  if (error) return { error: error.message }
  if (data?.error) return { error: data.error }

  const orgSlug = data?.org_slug
  revalidatePath('/dashboard')
  return { success: true, orgSlug }
}
