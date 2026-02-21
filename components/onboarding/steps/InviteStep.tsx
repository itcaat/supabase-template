'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useSupabase } from '@/lib/supabase/context'
import { sendInviteEmail } from '@/lib/invites'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { isTeamsMode } from '@/lib/config'
import type { OrgWithRole } from '@/lib/supabase/context'

const schema = z.object({
  invites: z.array(z.object({ email: z.string().email('Invalid email') })),
})
type FormData = z.infer<typeof schema>

interface InviteStepProps {
  org: OrgWithRole
  onNext: () => void
  onSkip: () => void
}

export function InviteStep({ org, onNext, onSkip }: InviteStepProps) {
  const { supabase, user } = useSupabase()
  const [isPending, setIsPending] = useState(false)
  const teamsMode = isTeamsMode()
  const { control, register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { invites: [{ email: '' }] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'invites' })

  if (!teamsMode) { onSkip(); return null }

  const onSubmit = async (data: FormData) => {
    if (!user) return
    const validEmails = data.invites.map((i) => i.email).filter(Boolean)
    if (validEmails.length === 0) { onNext(); return }
    setIsPending(true)

    let sent = 0
    for (const email of validEmails) {
      const token = crypto.randomUUID()
      const { data: inv, error } = await supabase.from('invitations').insert({
        org_id: org.id,
        email,
        role: 'member',
        token,
        invited_by: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }).select('id').single()

      if (!error && inv) {
        await sendInviteEmail(supabase, inv.id)
        sent++
      }
    }

    if (sent > 0) toast.success(`${sent} invitation${sent > 1 ? 's' : ''} sent`)
    onNext()
    setIsPending(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite your team</CardTitle>
        <CardDescription>Add teammates to <strong>{org.name}</strong>. You can always do this later.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <div className="flex-1">
                <Input placeholder="colleague@example.com" type="email" {...register(`invites.${index}.email`)} />
                {errors.invites?.[index]?.email && (
                  <p className="text-destructive text-xs mt-1">{errors.invites[index]?.email?.message}</p>
                )}
              </div>
              {fields.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={() => append({ email: '' })}>
            <Plus className="mr-1.5 h-4 w-4" />Add another
          </Button>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={onSkip}>Skip</Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? 'Sending…' : 'Send invitations'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
