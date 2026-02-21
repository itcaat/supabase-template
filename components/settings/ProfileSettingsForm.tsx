'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useSupabase } from '@/lib/supabase/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Profile } from '@/types'

const schema = z.object({ full_name: z.string().min(2, 'Name must be at least 2 characters') })
type FormData = z.infer<typeof schema>

interface ProfileSettingsFormProps { profile: Profile }

export function ProfileSettingsForm({ profile }: ProfileSettingsFormProps) {
  const { supabase, refreshProfile } = useSupabase()
  const [isPending, setIsPending] = useState(false)
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<FormData>({
    defaultValues: { full_name: profile.full_name ?? '' },
  })

  const onSubmit = async (data: FormData) => {
    setIsPending(true)
    const { error } = await supabase.from('profiles').update({ full_name: data.full_name }).eq('id', profile.id)
    if (error) toast.error(error.message)
    else { toast.success('Profile updated'); await refreshProfile() }
    setIsPending(false)
  }

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold">Profile</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={profile.email} disabled />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" {...register('full_name')} />
          {errors.full_name && <p className="text-destructive text-xs">{errors.full_name.message}</p>}
        </div>
        <Button type="submit" disabled={isPending || !isDirty}>
          {isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </form>
    </section>
  )
}
