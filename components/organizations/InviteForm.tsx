'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Mail } from 'lucide-react'
import { createInvitation } from '@/app/actions/invites'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RoleSelector } from './RoleSelector'
import type { MemberRole } from '@/types'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member', 'viewer'] as const),
})
type FormData = z.infer<typeof schema>

interface InviteFormProps {
  orgId: string
  projectId?: string
}

export function InviteForm({ orgId, projectId }: InviteFormProps) {
  const [isPending, startTransition] = useTransition()
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', role: 'member' },
  })

  const role = watch('role')

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const result = await createInvitation(orgId, data.email, data.role, projectId)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`Invitation sent to ${data.email}`)
        reset()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-2">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="invite-email">Invite by email</Label>
        <div className="relative">
          <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="invite-email"
            type="email"
            placeholder="colleague@example.com"
            className="pl-8"
            {...register('email')}
          />
        </div>
        {errors.email && (
          <p className="text-destructive text-xs">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Role</Label>
        <RoleSelector
          value={role}
          onChange={(r) => setValue('role', r as 'admin' | 'member' | 'viewer')}
          disabled={isPending}
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Sending…' : 'Send invite'}
      </Button>
    </form>
  )
}
