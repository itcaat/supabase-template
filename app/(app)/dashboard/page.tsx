import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { isTeamsMode, isMultiProjectMode } from '@/lib/config'
import { ROLE_LABELS } from '@/lib/rbac'
import type { Organization, MemberRole } from '@/types'

interface OrgWithRole extends Organization {
  role: MemberRole
}

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orgsData } = await supabase.rpc('get_user_organizations')
  const organizations: OrgWithRole[] = orgsData ?? []

  const cookieStore = await cookies()
  const activeSlug = cookieStore.get('active_org_slug')?.value
  const currentOrg = organizations.find((o) => o.slug === activeSlug) ?? organizations[0]

  const teamsMode = isTeamsMode()
  const multiProject = isMultiProjectMode()

  // Redirect to current org page
  if (currentOrg) {
    redirect(`/org/${currentOrg.slug}`)
  }

  return (
    <div className="p-8">
      <p className="text-muted-foreground">No organization found. Please contact support.</p>
    </div>
  )
}
