'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { MoreHorizontal, Trash2, Settings } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { deleteProject } from '@/app/actions/projects'
import type { Project, MemberRole } from '@/types'
import { canDo } from '@/lib/rbac'

interface ProjectCardProps {
  project: Project
  orgSlug: string
  userRole: MemberRole
}

export function ProjectCard({ project, orgSlug, userRole }: ProjectCardProps) {
  const [isPending, startTransition] = useTransition()
  const canManage = canDo(userRole, 'manage_projects')

  const handleDelete = () => {
    if (project.is_default) {
      toast.error('Cannot delete the default project')
      return
    }
    if (!confirm(`Delete project "${project.name}"? This cannot be undone.`)) return
    startTransition(async () => {
      const result = await deleteProject(project.id)
      if (result?.error) toast.error(result.error)
      else toast.success('Project deleted')
    })
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{project.name}</CardTitle>
            {project.description && (
              <CardDescription className="text-xs">{project.description}</CardDescription>
            )}
          </div>
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={handleDelete}
                  disabled={isPending || project.is_default}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs font-normal">
            {project.slug}
          </Badge>
          {project.is_default && (
            <Badge variant="outline" className="text-xs">Default</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
