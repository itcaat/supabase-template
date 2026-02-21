'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Users, FolderOpen, Mail } from 'lucide-react'
import { useSupabase } from '@/lib/supabase/context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getRoleLabel } from '@/lib/rbac'
import { isMultiProjectMode, isTeamsMode } from '@/lib/config'
import type { MemberRole } from '@/types'

interface Stats {
  memberCount: number
  projectCount: number
  pendingInvites: number
  role: MemberRole
}

export default function OrgPage() {
  const { slug } = useParams<{ slug: string }>()
  const { supabase, user } = useSupabase()
  const [org, setOrg] = useState<{ id: string; name: string; type: string } | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !slug) return
    const load = async () => {
      setLoading(true)
      const { data: orgData } = await supabase
        .from('organizations').select('*').eq('slug', slug).single()
      if (!orgData) { setLoading(false); return }
      setOrg(orgData)

      const [{ count: members }, { count: projects }, { count: invites }, { data: membership }] =
        await Promise.all([
          supabase.from('organization_members').select('*', { count: 'exact', head: true }).eq('org_id', orgData.id),
          supabase.from('projects').select('*', { count: 'exact', head: true }).eq('org_id', orgData.id),
          supabase.from('invitations').select('*', { count: 'exact', head: true }).eq('org_id', orgData.id).is('accepted_at', null),
          supabase.from('organization_members').select('role').eq('org_id', orgData.id).eq('user_id', user.id).single(),
        ])

      setStats({
        memberCount: members ?? 0,
        projectCount: projects ?? 0,
        pendingInvites: invites ?? 0,
        role: (membership?.role ?? 'viewer') as MemberRole,
      })
      setLoading(false)
    }
    load()
  }, [slug, user, supabase])

  const multiProject = isMultiProjectMode()
  const teamsMode = isTeamsMode()

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    )
  }

  if (!org || !stats) return <div className="p-8 text-muted-foreground">Organization not found.</div>

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold">{org.name}</h1>
          <Badge variant="outline" className="capitalize">{org.type}</Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          You are a <strong>{getRoleLabel(stats.role)}</strong> of this organization.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Members</CardDescription>
            <CardTitle className="text-3xl">{stats.memberCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="ghost" size="sm" className="px-0 text-muted-foreground hover:text-foreground">
              <Link href={`/org/${slug}/members`}><Users className="mr-1 h-4 w-4" />Manage members</Link>
            </Button>
          </CardContent>
        </Card>

        {multiProject && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Projects</CardDescription>
              <CardTitle className="text-3xl">{stats.projectCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild variant="ghost" size="sm" className="px-0 text-muted-foreground hover:text-foreground">
                <Link href={`/org/${slug}/projects`}><FolderOpen className="mr-1 h-4 w-4" />View projects</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {teamsMode && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending invites</CardDescription>
              <CardTitle className="text-3xl">{stats.pendingInvites}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild variant="ghost" size="sm" className="px-0 text-muted-foreground hover:text-foreground">
                <Link href={`/org/${slug}/members`}><Mail className="mr-1 h-4 w-4" />View invitations</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
