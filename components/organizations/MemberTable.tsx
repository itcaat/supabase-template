'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RoleSelector } from './RoleSelector'
import { updateMemberRole, removeMember } from '@/app/actions/organizations'
import { canDo, ROLE_LABELS } from '@/lib/rbac'
import type { MemberRole, OrganizationMember, Profile } from '@/types'

interface MemberWithProfile extends OrganizationMember {
  profile: Profile
}

interface MemberTableProps {
  members: MemberWithProfile[]
  orgId: string
  currentUserId: string
  currentUserRole: MemberRole
}

function getInitials(name: string | null, email: string): string {
  if (name) return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  return email.slice(0, 2).toUpperCase()
}

export function MemberTable({ members, orgId, currentUserId, currentUserRole }: MemberTableProps) {
  const [isPending, startTransition] = useTransition()
  const canManage = canDo(currentUserRole, 'manage_members')

  const handleRoleChange = (userId: string, role: MemberRole) => {
    startTransition(async () => {
      const result = await updateMemberRole(orgId, userId, role)
      if (result?.error) toast.error(result.error)
      else toast.success('Role updated')
    })
  }

  const handleRemove = (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from this organization?`)) return
    startTransition(async () => {
      const result = await removeMember(orgId, userId)
      if (result?.error) toast.error(result.error)
      else toast.success('Member removed')
    })
  }

  return (
    <div className="divide-y rounded-md border">
      {members.map((member) => {
        const isSelf = member.user_id === currentUserId
        const isOwner = member.role === 'owner'

        return (
          <div key={member.id} className="flex items-center gap-3 p-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={member.profile.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs">
                {getInitials(member.profile.full_name, member.profile.email)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {member.profile.full_name ?? member.profile.email}
                {isSelf && (
                  <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground truncate">{member.profile.email}</p>
            </div>

            <div className="flex items-center gap-2">
              {canManage && !isSelf && !isOwner ? (
                <RoleSelector
                  value={member.role}
                  onChange={(role) => handleRoleChange(member.user_id, role)}
                  disabled={isPending}
                />
              ) : (
                <Badge variant="secondary" className="capitalize">
                  {ROLE_LABELS[member.role]}
                </Badge>
              )}

              {canManage && !isSelf && !isOwner && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    handleRemove(
                      member.user_id,
                      member.profile.full_name ?? member.profile.email,
                    )
                  }
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
