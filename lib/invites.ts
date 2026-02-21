import type { SupabaseClient } from '@supabase/supabase-js'

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Calls the send-invite-email Edge Function.
 * The function validates auth, fetches invitation details, and sends the email via Resend.
 */
export async function sendInviteEmail(
  supabase: SupabaseClient,
  invitationId: string,
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke('send-invite-email', {
    body: { invitationId },
  })
  if (error) return { success: false, error: error.message }
  if (data?.error) return { success: false, error: data.error }
  return { success: true }
}
