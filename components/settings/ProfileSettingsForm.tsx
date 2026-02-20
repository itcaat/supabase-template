'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { updateProfile } from '@/app/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Profile } from '@/types'

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(60),
})
type FormData = z.infer<typeof schema>

function getInitials(name: string | null, email: string): string {
  if (name) return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  return email.slice(0, 2).toUpperCase()
}

export function ProfileSettingsForm({ profile }: { profile: Profile }) {
  const [isPending, startTransition] = useTransition()
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: profile.full_name ?? '' },
  })

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.append('full_name', data.full_name)
      const result = await updateProfile(formData)
      if (result?.error) toast.error(result.error)
      else toast.success('Profile updated')
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your personal information.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="text-lg">
                {getInitials(profile.full_name, profile.email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{profile.full_name ?? 'Your name'}</p>
              <p className="text-xs text-muted-foreground">{profile.email}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" {...register('full_name')} />
            {errors.full_name && (
              <p className="text-destructive text-xs">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={profile.email} disabled />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed here. Contact support if needed.
            </p>
          </div>

          <Button type="submit" disabled={isPending || !isDirty}>
            {isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
