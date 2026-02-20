import { redirect, notFound } from 'next/navigation'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { canDo } from '@/lib/rbac'
import { isMultiProjectMode } from '@/lib/config'
import { FolderOpen } from 'lucide-react'
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog'
import type { MemberRole } from '@/types'

interface Props {
  params: Promise<{ slug: string }>
}

export const metadata = { title: 'Projects' }

export default async function ProjectsPage({ params }: Props) {
  const { slug } = await params

  if (!isMultiProjectMode()) redirect(`/org/${slug}`)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single()
  if (!org) notFound()

  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('org_id', org.id)
    .eq('user_id', user.id)
    .single()
  if (!membership) notFound()

  const currentUserRole = membership.role as MemberRole

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('org_id', org.id)
    .order('created_at', { ascending: true })

  const canCreate = canDo(currentUserRole, 'manage_projects')

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Projects within <strong>{org.name}</strong>
          </p>
        </div>
        {canCreate && <CreateProjectDialog orgId={org.id} />}
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              orgSlug={slug}
              userRole={currentUserRole}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Create your first project to start organizing your work."
          action={canCreate ? <CreateProjectDialog orgId={org.id} /> : undefined}
        />
      )}
    </div>
  )
}
