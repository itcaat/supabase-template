'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, redirect } from 'next/navigation'
import { FolderOpen } from 'lucide-react'
import { useSupabase } from '@/lib/supabase/context'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { canDo } from '@/lib/rbac'
import { isMultiProjectMode } from '@/lib/config'
import type { MemberRole, Project } from '@/types'

export default function ProjectsPage() {
  const { slug } = useParams<{ slug: string }>()
  const { supabase, user } = useSupabase()
  const [org, setOrg] = useState<{ id: string; name: string } | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<MemberRole>('viewer')
  const [loading, setLoading] = useState(true)

  if (!isMultiProjectMode()) redirect(`/org/${slug}`)

  const load = useCallback(async () => {
    if (!user || !slug) return
    const { data: orgData } = await supabase.from('organizations').select('id,name').eq('slug', slug).single()
    if (!orgData) return
    setOrg(orgData)

    const [{ data: projectsData }, { data: myMembership }] = await Promise.all([
      supabase.from('projects').select('*').eq('org_id', orgData.id).order('created_at'),
      supabase.from('organization_members').select('role').eq('org_id', orgData.id).eq('user_id', user.id).single(),
    ])

    setProjects(projectsData ?? [])
    setCurrentUserRole((myMembership?.role ?? 'viewer') as MemberRole)
    setLoading(false)
  }, [slug, user, supabase])

  useEffect(() => { load() }, [load])

  const canCreate = canDo(currentUserRole, 'manage_projects')

  if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-8 w-32" /><div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-28" /><Skeleton className="h-28" /></div></div>
  if (!org) return <div className="p-8 text-muted-foreground">Organization not found.</div>

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">Projects within <strong>{org.name}</strong></p>
        </div>
        {canCreate && <CreateProjectDialog orgId={org.id} onSuccess={load} />}
      </div>

      {projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} orgSlug={slug} userRole={currentUserRole} onDelete={load} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Create your first project to start organizing your work."
          action={canCreate ? <CreateProjectDialog orgId={org.id} onSuccess={load} /> : undefined}
        />
      )}
    </div>
  )
}
