'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useSupabase } from '@/lib/supabase/context'
import { slugify } from '@/lib/invites'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { OrgWithRole } from '@/lib/supabase/context'

const schema = z.object({ name: z.string().min(2, 'Name must be at least 2 characters') })
type FormData = z.infer<typeof schema>

interface OrgStepProps {
  defaultOrg: OrgWithRole
  onNext: (org: OrgWithRole) => void
}

export function OrgStep({ defaultOrg, onNext }: OrgStepProps) {
  const { supabase, user, refreshOrgs } = useSupabase()
  const [isPending, setIsPending] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: { name: defaultOrg.name },
  })

  const onSubmit = async (data: FormData) => {
    if (!user) return
    setIsPending(true)

    const isDefault = data.name === defaultOrg.name
    if (isDefault) {
      // Update the existing personal org name
      const { error } = await supabase.from('organizations').update({ name: data.name }).eq('id', defaultOrg.id)
      if (error) { toast.error(error.message); setIsPending(false); return }
      await refreshOrgs()
      onNext({ ...defaultOrg, name: data.name })
    } else {
      // Create a new team org
      const slug = slugify(data.name) || `org-${Date.now()}`
      const { data: org, error } = await supabase.from('organizations').insert({
        name: data.name, slug, type: 'team',
      }).select('*').single()

      if (error) { toast.error(error.message); setIsPending(false); return }

      await supabase.from('organization_members').insert({ org_id: org.id, user_id: user.id, role: 'owner' })
      await refreshOrgs()
      onNext({ ...org, role: 'owner' } as OrgWithRole)
    }

    setIsPending(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Name your workspace</CardTitle>
        <CardDescription>This is the name of your organization or team.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Organization name</Label>
            <Input id="name" placeholder="Acme Inc." {...register('name')} />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Saving…' : 'Continue'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
