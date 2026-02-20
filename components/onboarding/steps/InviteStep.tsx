'use client'

import { useState, useTransition } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Trash2, Users } from 'lucide-react'
import { createInvitation } from '@/app/actions/invites'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RoleSelector } from '@/components/organizations/RoleSelector'
import type { WorkspaceMode, MemberRole } from '@/types'

const schema = z.object({
  invites: z.array(z.object({
    email: z.string().email('Invalid email'),
    role: z.enum(['admin', 'member', 'viewer'] as const),
  })),
})
type FormData = z.infer<typeof schema>

interface InviteStepProps {
  orgId: string
  workspaceMode: WorkspaceMode
  onNext: () => void
  onBack: () => void
}

export function InviteStep({ orgId, workspaceMode, onNext, onBack }: InviteStepProps) {
  const [isPending, startTransition] = useTransition()
  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { invites: [{ email: '', role: 'member' }] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'invites' })

  if (workspaceMode === 'solo') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center py-4">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold">Solo mode — no invites needed</h2>
          <p className="text-muted-foreground text-sm mt-1 max-w-sm">
            You&apos;re working solo. You can always enable team features and invite
            collaborators later from the Members settings.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} className="flex-1">Back</Button>
          <Button onClick={onNext} className="flex-1">Continue</Button>
        </div>
      </div>
    )
  }

  const onSubmit = (data: FormData) => {
    const validInvites = data.invites.filter((i) => i.email)
    if (validInvites.length === 0) {
      onNext()
      return
    }

    startTransition(async () => {
      const results = await Promise.all(
        validInvites.map((inv) => createInvitation(orgId, inv.email, inv.role)),
      )
      const errors = results.filter((r) => r?.error)
      if (errors.length > 0) {
        toast.error(`${errors.length} invitation(s) failed to send`)
      } else {
        toast.success(`${validInvites.length} invitation(s) sent`)
      }
      onNext()
    })
  }

  const invites = watch('invites')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Invite your team</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Add teammates to your workspace. You can skip this and invite them later.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  {...register(`invites.${index}.email`)}
                />
                {errors.invites?.[index]?.email && (
                  <p className="text-destructive text-xs mt-0.5">
                    {errors.invites[index]!.email!.message}
                  </p>
                )}
              </div>
              <RoleSelector
                value={invites[index]?.role ?? 'member'}
                onChange={(role) => setValue(`invites.${index}.role`, role as 'admin' | 'member' | 'viewer')}
              />
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => append({ email: '', role: 'member' })}
          className="text-muted-foreground"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add another
        </Button>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">Back</Button>
          <Button type="button" variant="ghost" onClick={onNext} className="flex-none px-3">
            Skip
          </Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? 'Sending…' : 'Send invites'}
          </Button>
        </div>
      </form>
    </div>
  )
}
