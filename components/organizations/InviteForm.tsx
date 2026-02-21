'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useSupabase } from '@/lib/supabase/context'
import { sendInviteEmail } from '@/lib/invites'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { MemberRole } from '@/types'

const schema = z.object({
  email: z.string().email('Invalid email'),
  role: z.enum(['admin', 'member', 'viewer']),
})
type FormData = z.infer<typeof schema>

interface InviteFormProps {
  orgId: string
  onMutate: () => void
}

export function InviteForm({ orgId, onMutate }: InviteFormProps) {
  const { supabase, user } = useSupabase()
  const [isPending, setIsPending] = useState(false)
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'member' },
  })

  const onSubmit = async (data: FormData) => {
    if (!user) return
    setIsPending(true)

    try {
      // Create the invitation record
      const token = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: inv, error: invErr } = await supabase.from('invitations').insert({
        org_id: orgId,
        email: data.email,
        role: data.role as MemberRole,
        token,
        invited_by: user.id,
        expires_at: expiresAt,
      }).select('id').single()

      if (invErr) { toast.error(invErr.message); return }

      // Send invite email via Edge Function
      const { success, error } = await sendInviteEmail(supabase, inv.id)
      if (!success) toast.error(`Invite created but email failed: ${error}`)
      else toast.success(`Invitation sent to ${data.email}`)

      reset()
      onMutate()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
      <div className="flex-1">
        <Input placeholder="colleague@example.com" type="email" {...register('email')} />
        {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
      </div>
      <Select value={watch('role')} onValueChange={(v) => setValue('role', v as FormData['role'])}>
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="member">Member</SelectItem>
          <SelectItem value="viewer">Viewer</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit" disabled={isPending}>{isPending ? 'Sending…' : 'Invite'}</Button>
    </form>
  )
}
