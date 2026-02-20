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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Organization } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
})
type FormData = z.infer<typeof schema>

interface OrgSettingsFormProps {
  org: Organization
  canEdit: boolean
}

export function OrgSettingsForm({ org, canEdit }: OrgSettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: org.name },
  })

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.append('name', data.name)
      const result = await updateOrganization(org.id, formData)
      if (result?.error) toast.error(result.error)
      else toast.success('Organization updated')
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>General</CardTitle>
        <CardDescription>Update your organization name and details.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="org-name">Organization name</Label>
            <Input
              id="org-name"
              {...register('name')}
              disabled={!canEdit}
            />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input value={org.slug} disabled className="font-mono text-sm" />
            <p className="text-xs text-muted-foreground">Slug cannot be changed after creation.</p>
          </div>
          {canEdit && (
            <Button type="submit" disabled={isPending || !isDirty}>
              {isPending ? 'Saving…' : 'Save changes'}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
