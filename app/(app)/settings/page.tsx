'use client'

import { useSupabase } from '@/lib/supabase/context'
import { ProfileSettingsForm } from '@/components/settings/ProfileSettingsForm'
import { PasswordChangeForm } from '@/components/settings/PasswordChangeForm'
import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsPage() {
  const { profile, loading } = useSupabase()

  if (loading || !profile) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48" />
      </div>
    )
  }

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
