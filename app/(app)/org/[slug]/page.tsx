import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Users, FolderOpen, Mail, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getRoleLabel } from '@/lib/rbac'
import { isMultiProjectMode, isTeamsMode } from '@/lib/config'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function OrgPage({ params }: Props) {
  const { slug } = await params
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

  const [{ count: memberCount }, { count: projectCount }, { count: pendingInvites }] =
    await Promise.all([
      supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', org.id),
      supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', org.id),
      supabase
        .from('invitations')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', org.id)
        .is('accepted_at', null),
    ])

  const multiProject = isMultiProjectMode()
  const teamsMode = isTeamsMode()

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold">{org.name}</h1>
          <Badge variant="outline" className="capitalize">{org.type}</Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          You are a <strong>{getRoleLabel(membership.role)}</strong> of this organization.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Members</CardDescription>
            <CardTitle className="text-3xl">{memberCount ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="ghost" size="sm" className="px-0 text-muted-foreground hover:text-foreground">
              <Link href={`/org/${slug}/members`}>
                <Users className="mr-1 h-4 w-4" />
                Manage members
              </Link>
            </Button>
          </CardContent>
        </Card>

        {multiProject && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Projects</CardDescription>
              <CardTitle className="text-3xl">{projectCount ?? 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild variant="ghost" size="sm" className="px-0 text-muted-foreground hover:text-foreground">
                <Link href={`/org/${slug}/projects`}>
                  <FolderOpen className="mr-1 h-4 w-4" />
                  View projects
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {teamsMode && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending invites</CardDescription>
              <CardTitle className="text-3xl">{pendingInvites ?? 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild variant="ghost" size="sm" className="px-0 text-muted-foreground hover:text-foreground">
                <Link href={`/org/${slug}/members`}>
                  <Mail className="mr-1 h-4 w-4" />
                  View invitations
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
