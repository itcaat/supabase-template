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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { isMultiProjectMode } from '@/lib/config'
import type { OrgWithRole } from '@/lib/supabase/context'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().max(200).optional(),
})
type FormData = z.infer<typeof schema>

interface ProjectStepProps {
  org: OrgWithRole
  onNext: () => void
  onSkip: () => void
}

export function ProjectStep({ org, onNext, onSkip }: ProjectStepProps) {
  const { supabase, user } = useSupabase()
  const [isPending, setIsPending] = useState(false)
  const multiProject = isMultiProjectMode()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: { name: 'My First Project' },
  })

  const onSubmit = async (data: FormData) => {
    if (!user) return
    setIsPending(true)
    const slug = slugify(data.name) || `project-${Date.now()}`
    const { data: project, error } = await supabase.from('projects').insert({
      org_id: org.id,
      name: data.name,
      slug,
      description: data.description || null,
    }).select('id').single()

    if (error) { toast.error(error.message); setIsPending(false); return }
    await supabase.from('project_members').insert({ project_id: project.id, user_id: user.id, role: 'owner' })
    onNext()
    setIsPending(false)
  }

  if (!multiProject) {
    onSkip()
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your first project</CardTitle>
        <CardDescription>Projects help you organize work within your organization.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Project name</Label>
            <Input id="name" placeholder="My Project" {...register('name')} />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea id="description" placeholder="What is this project about?" rows={2} {...register('description')} />
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={onSkip}>Skip</Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? 'Creating…' : 'Create project'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
