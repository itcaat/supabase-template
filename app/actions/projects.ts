'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/invites'
import type { MemberRole } from '@/types'

export async function createProject(orgId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const name = (formData.get('name') as string).trim()
  const description = formData.get('description') as string | null

  if (!name) return { error: 'Project name is required' }

  let slug = slugify(name)

  const { data: existing } = await supabase
    .from('projects')
    .select('slug')
    .eq('org_id', orgId)
    .ilike('slug', `${slug}%`)

  if (existing && existing.length > 0) {
    const slugs = new Set(existing.map((p) => p.slug))
    let counter = 1
    while (slugs.has(slug)) {
      slug = `${slugify(name)}-${counter++}`
    }
  }

  const { data: project, error } = await supabase
    .from('projects')
    .insert({ org_id: orgId, name, slug, description })
    .select()
    .single()

  if (error) return { error: error.message }

  // Add creator as owner
  await supabase
    .from('project_members')
    .insert({ project_id: project.id, user_id: user.id, role: 'owner' })

  revalidatePath('/org')
  return { success: true, project }
}

export async function updateProject(projectId: string, formData: FormData) {
  const supabase = await createClient()

  const name = (formData.get('name') as string).trim()
  const description = formData.get('description') as string | null

  const { error } = await supabase
    .from('projects')
    .update({ name, description })
    .eq('id', projectId)

  if (error) return { error: error.message }

  revalidatePath('/org')
  return { success: true }
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (error) return { error: error.message }

  revalidatePath('/org')
  return { success: true }
}

export async function updateProjectMemberRole(
  projectId: string,
  userId: string,
  role: MemberRole,
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('project_members')
    .update({ role })
    .eq('project_id', projectId)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath('/org')
  return { success: true }
}

export async function removeProjectMember(projectId: string, userId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath('/org')
  return { success: true }
}
