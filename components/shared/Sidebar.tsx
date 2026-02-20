import Link from 'next/link'
import { LayoutDashboard, Users, FolderOpen, Settings, ChevronRight } from 'lucide-react'
import { OrgSwitcher } from '@/components/organizations/OrgSwitcher'
import { UserMenu } from '@/components/shared/UserMenu'
import { cn } from '@/lib/utils'
import type { Organization, Profile, MemberRole } from '@/types'
import { isMultiProjectMode } from '@/lib/config'

interface OrgWithRole extends Organization {
  role: MemberRole
}

interface SidebarProps {
  profile: Profile
  organizations: OrgWithRole[]
  currentOrg: Organization
  currentSlug: string
}

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  active?: boolean
}

function NavItem({ href, icon, label, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
        active
          ? 'bg-accent text-accent-foreground font-medium'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
      )}
    >
      {icon}
      {label}
    </Link>
  )
}

export function Sidebar({ profile, organizations, currentOrg, currentSlug }: SidebarProps) {
  const multiProject = isMultiProjectMode()
  const orgBase = `/org/${currentSlug}`

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r bg-background">
      {/* Org switcher */}
      <div className="p-2 border-b">
        <OrgSwitcher organizations={organizations} currentOrg={currentOrg} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <NavItem
          href="/dashboard"
          icon={<LayoutDashboard className="h-4 w-4" />}
          label="Dashboard"
        />
        <NavItem
          href={`${orgBase}/members`}
          icon={<Users className="h-4 w-4" />}
          label="Members"
        />
        {multiProject && (
          <NavItem
            href={`${orgBase}/projects`}
            icon={<FolderOpen className="h-4 w-4" />}
            label="Projects"
          />
        )}
        <NavItem
          href={`${orgBase}/settings`}
          icon={<Settings className="h-4 w-4" />}
          label="Org Settings"
        />
      </nav>

      {/* User section */}
      <div className="p-2 border-t">
        <UserMenu profile={profile} />
      </div>
    </aside>
  )
}
