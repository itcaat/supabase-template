'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronsUpDown, Plus, Building2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Organization, MemberRole } from '@/types'
import { isTeamsMode } from '@/lib/config'

interface OrgWithRole extends Organization {
  role: MemberRole
}

interface OrgSwitcherProps {
  organizations: OrgWithRole[]
  currentOrg: Organization
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function OrgSwitcher({ organizations, currentOrg }: OrgSwitcherProps) {
  const router = useRouter()
  const teamsMode = isTeamsMode()

  const handleSelect = (slug: string) => {
    document.cookie = `active_org_slug=${slug}; path=/; max-age=2592000`
    router.push(`/org/${slug}`)
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-2 px-2 h-auto py-2">
          <Avatar className="h-6 w-6 rounded-md">
            <AvatarImage src={currentOrg.avatar_url ?? undefined} />
            <AvatarFallback className="rounded-md text-xs">
              {getInitials(currentOrg.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-medium truncate">{currentOrg.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{currentOrg.type}</p>
          </div>
          <ChevronsUpDown className="h-3 w-3 text-muted-foreground shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSelect(org.slug)}
            className="gap-2"
          >
            <Avatar className="h-5 w-5 rounded-sm">
              <AvatarImage src={org.avatar_url ?? undefined} />
              <AvatarFallback className="rounded-sm text-xs">
                {getInitials(org.name)}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 truncate">{org.name}</span>
            {org.id === currentOrg.id && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
        {teamsMode && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard?create=org')} className="gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-sm border border-dashed">
                <Plus className="h-3 w-3" />
              </div>
              <span>Create organization</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
