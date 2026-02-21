'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, FolderOpen, Settings } from 'lucide-react'
import { useSupabase } from '@/lib/supabase/context'
import { OrgSwitcher } from '@/components/organizations/OrgSwitcher'
import { UserMenu } from '@/components/shared/UserMenu'
import { cn } from '@/lib/utils'
import { isMultiProjectMode } from '@/lib/config'

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
}

function NavItem({ href, icon, label }: NavItemProps) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(href + '/')
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

export function Sidebar() {
  const { profile, currentOrg } = useSupabase()
  const multiProject = isMultiProjectMode()
  const orgBase = currentOrg ? `/org/${currentOrg.slug}` : '#'

  if (!profile || !currentOrg) return null

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r bg-background">
      <div className="p-2 border-b">
        <OrgSwitcher />
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <NavItem href="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" />
        <NavItem href={`${orgBase}/members`} icon={<Users className="h-4 w-4" />} label="Members" />
        {multiProject && (
          <NavItem href={`${orgBase}/projects`} icon={<FolderOpen className="h-4 w-4" />} label="Projects" />
        )}
        <NavItem href={`${orgBase}/settings`} icon={<Settings className="h-4 w-4" />} label="Org Settings" />
      </nav>

      <div className="p-2 border-t">
        <UserMenu />
      </div>
    </aside>
  )
}
