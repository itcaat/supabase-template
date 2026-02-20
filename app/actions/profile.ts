'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const full_name = formData.get('full_name') as string
  const avatar_url = formData.get('avatar_url') as string | null

  const updates: Record<string, string | null> = { full_name }
  if (avatar_url !== null) updates.avatar_url = avatar_url

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/settings')
  return { success: true }
}

export async function completeOnboarding() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('id', user.id)

  if (error) return { error: error.message }

  return { success: true }
}
