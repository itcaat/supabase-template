import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/shared/Sidebar'
import type { Organization, MemberRole } from '@/types'

interface OrgWithRole extends Organization {
  role: MemberRole
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Fetch user's organizations with their role
  const { data: orgsData } = await supabase.rpc('get_user_organizations')
  const organizations: OrgWithRole[] = orgsData ?? []

  if (organizations.length === 0) redirect('/onboarding')

  // Determine active org from cookie or default to first
  const cookieStore = await cookies()
  const activeSlug = cookieStore.get('active_org_slug')?.value
  const currentOrg =
    organizations.find((o) => o.slug === activeSlug) ?? organizations[0]

  // Set cookie if not set or stale
  if (!activeSlug || !organizations.find((o) => o.slug === activeSlug)) {
    cookieStore.set('active_org_slug', currentOrg.slug, { path: '/', maxAge: 2592000 })
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        profile={profile}
        organizations={organizations}
        currentOrg={currentOrg}
        currentSlug={currentOrg.slug}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
