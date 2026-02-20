'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { User, Settings, LogOut, ChevronsUpDown } from 'lucide-react'
import { signOut } from '@/app/actions/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type { Profile } from '@/types'

interface UserMenuProps {
  profile: Profile
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return email.slice(0, 2).toUpperCase()
}

export function UserMenu({ profile }: UserMenuProps) {
  const [isPending, startTransition] = useTransition()

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-2 px-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs">
              {getInitials(profile.full_name, profile.email)}
            </AvatarFallback>
          </Avatar>
          <span className="flex-1 text-left text-sm truncate">
            {profile.full_name ?? profile.email}
          </span>
          <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{profile.full_name ?? 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} disabled={isPending} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          {isPending ? 'Signing out…' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
