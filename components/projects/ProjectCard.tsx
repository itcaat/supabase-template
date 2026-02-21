'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { useSupabase } from '@/lib/supabase/context'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { canDo } from '@/lib/rbac'
import type { MemberRole, Project } from '@/types'

interface ProjectCardProps {
  project: Project
  orgSlug: string
  userRole: MemberRole
  onDelete: () => void
}

export function ProjectCard({ project, userRole, onDelete }: ProjectCardProps) {
  const { supabase } = useSupabase()
  const [isPending, setIsPending] = useState(false)
  const canDelete = canDo(userRole, 'manage_projects')

  const handleDelete = async () => {
    if (!confirm(`Delete project "${project.name}"? This cannot be undone.`)) return
    setIsPending(true)
    const { error } = await supabase.from('projects').delete().eq('id', project.id)
    if (error) toast.error(error.message)
    else { toast.success('Project deleted'); onDelete() }
    setIsPending(false)
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{project.name}</CardTitle>
          {project.is_default && <Badge variant="secondary" className="shrink-0">Default</Badge>}
        </div>
        {project.description && <CardDescription className="text-xs">{project.description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-xs text-muted-foreground font-mono">{project.slug}</p>
      </CardContent>
      {canDelete && !project.is_default && (
        <CardFooter>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" disabled={isPending} onClick={handleDelete}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            {isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
