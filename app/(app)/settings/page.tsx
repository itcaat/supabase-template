import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileSettingsForm } from '@/components/settings/ProfileSettingsForm'
import { PasswordChangeForm } from '@/components/settings/PasswordChangeForm'

export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="p-8 max-w-2xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account preferences</p>
      </div>

      <ProfileSettingsForm profile={profile} />
      <PasswordChangeForm />
    </div>
  )
}
