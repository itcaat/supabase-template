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
import type { Organization } from '@/types'

const schema = z.object({ name: z.string().min(2, 'Name must be at least 2 characters') })
type FormData = z.infer<typeof schema>

interface OrgSettingsFormProps {
  org: Organization
  canEdit: boolean
}

export function OrgSettingsForm({ org, canEdit }: OrgSettingsFormProps) {
  const { supabase, refreshOrgs } = useSupabase()
  const [isPending, setIsPending] = useState(false)
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<FormData>({
    defaultValues: { name: org.name },
  })

  const onSubmit = async (data: FormData) => {
    setIsPending(true)
    const { error } = await supabase.from('organizations').update({ name: data.name }).eq('id', org.id)
    if (error) toast.error(error.message)
    else { toast.success('Organization updated'); await refreshOrgs() }
    setIsPending(false)
  }

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold">General</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Organization name</Label>
          <Input id="name" {...register('name')} disabled={!canEdit} />
          {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
        </div>
        {canEdit && (
          <Button type="submit" disabled={isPending || !isDirty}>
            {isPending ? 'Saving…' : 'Save changes'}
          </Button>
        )}
      </form>
    </section>
  )
}
