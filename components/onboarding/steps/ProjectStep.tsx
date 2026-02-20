'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { FolderOpen } from 'lucide-react'
import { createProject } from '@/app/actions/projects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ProjectMode } from '@/types'

const schema = z.object({
  name: z.string().min(1, 'Project name is required').max(50),
  description: z.string().max(200).optional(),
})
type FormData = z.infer<typeof schema>

interface ProjectStepProps {
  orgId: string
  projectMode: ProjectMode
  onNext: () => void
  onBack: () => void
}

export function ProjectStep({ orgId, projectMode, onNext, onBack }: ProjectStepProps) {
  const [isPending, startTransition] = useTransition()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  })

  if (projectMode === 'single') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center py-4">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FolderOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold">Projects are ready</h2>
          <p className="text-muted-foreground text-sm mt-1 max-w-sm">
            You&apos;re using single-workspace mode. A default project has been created
            automatically — no extra setup needed.
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
    startTransition(async () => {
      const formData = new FormData()
      formData.append('name', data.name)
      if (data.description) formData.append('description', data.description)
      const result = await createProject(orgId, formData)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      onNext()
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Create your first project</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Projects help you organize work within your workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="proj-name">Project name</Label>
          <Input id="proj-name" placeholder="My first project" {...register('name')} autoFocus />
          {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="proj-desc">Description (optional)</Label>
          <Input id="proj-desc" placeholder="What is this project about?" {...register('description')} />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">Back</Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? 'Creating…' : 'Create project'}
          </Button>
        </div>
      </form>
    </div>
  )
}
