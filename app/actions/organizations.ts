'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/invites'
import type { MemberRole } from '@/types'

export async function createOrganization(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const name = (formData.get('name') as string).trim()
  const type = (formData.get('type') as string) || 'team'

  if (!name) return { error: 'Organization name is required' }

  let slug = slugify(name)

  // Ensure unique slug
  const { data: existing } = await supabase
    .from('organizations')
    .select('slug')
    .ilike('slug', `${slug}%`)

  if (existing && existing.length > 0) {
    const slugs = new Set(existing.map((o) => o.slug))
    let counter = 1
    while (slugs.has(slug)) {
      slug = `${slugify(name)}-${counter++}`
    }
  }

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({ name, slug, type })
    .select()
    .single()

  if (orgError) return { error: orgError.message }

  // Add creator as owner
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({ org_id: org.id, user_id: user.id, role: 'owner' })

  if (memberError) return { error: memberError.message }

  // Create default project
  await supabase
    .from('projects')
    .insert({ org_id: org.id, name: 'Default', slug: 'default', is_default: true })

  revalidatePath('/dashboard')
  return { success: true, org }
}

export async function updateOrganization(orgId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const name = (formData.get('name') as string).trim()
  const avatar_url = formData.get('avatar_url') as string | null

  const updates: Record<string, string | null> = { name }
  if (avatar_url !== null) updates.avatar_url = avatar_url

  const { error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', orgId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteOrganization(orgId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify owner
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'owner') {
    return { error: 'Only owners can delete organizations' }
  }

  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', orgId)

  if (error) return { error: error.message }

  redirect('/dashboard')
}

export async function updateMemberRole(orgId: string, userId: string, role: MemberRole) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('organization_members')
    .update({ role })
    .eq('org_id', orgId)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath(`/org`)
  return { success: true }
}

export async function removeMember(orgId: string, userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('org_id', orgId)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath(`/org`)
  return { success: true }
}
