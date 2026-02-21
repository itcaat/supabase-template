'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useSupabase } from '@/lib/supabase/context'
import { slugify } from '@/lib/invites'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().max(200).optional(),
})
type FormData = z.infer<typeof schema>

interface CreateProjectDialogProps {
  orgId: string
  onSuccess: () => void
}

export function CreateProjectDialog({ orgId, onSuccess }: CreateProjectDialogProps) {
  const { supabase, user } = useSupabase()
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    if (!user) return
    setIsPending(true)
    const slug = slugify(data.name)
    const { data: project, error } = await supabase.from('projects').insert({
      org_id: orgId,
      name: data.name,
      slug: slug || `project-${Date.now()}`,
      description: data.description || null,
    }).select('id').single()

    if (error) { toast.error(error.message); setIsPending(false); return }

    await supabase.from('project_members').insert({ project_id: project.id, user_id: user.id, role: 'owner' })
    toast.success('Project created')
    reset()
    setOpen(false)
    onSuccess()
    setIsPending(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="mr-1.5 h-4 w-4" />New project</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
          <DialogDescription>Add a new project to your organization.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Project name</Label>
            <Input id="name" placeholder="My Project" {...register('name')} />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea id="description" placeholder="What is this project about?" rows={3} {...register('description')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setOpen(false); reset() }}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? 'Creating…' : 'Create project'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
