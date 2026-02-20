'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createProject } from '@/app/actions/projects'

const schema = z.object({
  name: z.string().min(1, 'Project name is required').max(50),
  description: z.string().max(200).optional(),
})
type FormData = z.infer<typeof schema>

interface CreateProjectDialogProps {
  orgId: string
}

export function CreateProjectDialog({ orgId }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.append('name', data.name)
      if (data.description) formData.append('description', data.description)
      const result = await createProject(orgId, formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Project created')
        reset()
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          New project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="proj-name">Name</Label>
            <Input id="proj-name" placeholder="My project" {...register('name')} />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proj-desc">Description (optional)</Label>
            <Textarea
              id="proj-desc"
              placeholder="What is this project about?"
              rows={3}
              {...register('description')}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating…' : 'Create project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
