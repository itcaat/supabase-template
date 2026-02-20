'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { updateOrganization } from '@/app/actions/organizations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Organization } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
})
type FormData = z.infer<typeof schema>

interface OrgStepProps {
  personalOrg: Organization
  onNext: (orgId: string, orgSlug: string) => void
  onBack: () => void
}

export function OrgStep({ personalOrg, onNext, onBack }: OrgStepProps) {
  const [isPending, startTransition] = useTransition()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: personalOrg.name },
  })

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.append('name', data.name)
      const result = await updateOrganization(personalOrg.id, formData)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      onNext(personalOrg.id, personalOrg.slug)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Name your workspace</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Give your workspace a name that represents you or your team.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="org-name">Workspace name</Label>
          <Input
            id="org-name"
            placeholder="Acme Inc."
            {...register('name')}
            autoFocus
          />
          {errors.name && (
            <p className="text-destructive text-xs">{errors.name.message}</p>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? 'Saving…' : 'Continue'}
          </Button>
        </div>
      </form>
    </div>
  )
}
