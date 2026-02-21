'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { useSupabase } from '@/lib/supabase/context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RoleSelector } from './RoleSelector'
import { canDo, ROLE_LABELS } from '@/lib/rbac'
import type { MemberRole, OrganizationMember, Profile } from '@/types'

interface MemberWithProfile extends OrganizationMember { profile: Profile }

interface MemberTableProps {
  members: MemberWithProfile[]
  orgId: string
  currentUserId: string
  currentUserRole: MemberRole
  onMutate: () => void
}

function getInitials(name: string | null, email: string): string {
  if (name) return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  return email.slice(0, 2).toUpperCase()
}

export function MemberTable({ members, orgId, currentUserId, currentUserRole, onMutate }: MemberTableProps) {
  const { supabase } = useSupabase()
  const [isPending, setIsPending] = useState(false)
  const canManage = canDo(currentUserRole, 'manage_members')

  const handleRoleChange = async (userId: string, role: MemberRole) => {
    setIsPending(true)
    const { error } = await supabase.from('organization_members').update({ role }).eq('org_id', orgId).eq('user_id', userId)
    if (error) toast.error(error.message)
    else { toast.success('Role updated'); onMutate() }
    setIsPending(false)
  }

  const handleRemove = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from this organization?`)) return
    setIsPending(true)
    const { error } = await supabase.from('organization_members').delete().eq('org_id', orgId).eq('user_id', userId)
    if (error) toast.error(error.message)
    else { toast.success('Member removed'); onMutate() }
    setIsPending(false)
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
              <AvatarFallback className="text-xs">{getInitials(member.profile.full_name, member.profile.email)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {member.profile.full_name ?? member.profile.email}
                {isSelf && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
              </p>
              <p className="text-xs text-muted-foreground truncate">{member.profile.email}</p>
            </div>
            <div className="flex items-center gap-2">
              {canManage && !isSelf && !isOwner ? (
                <RoleSelector value={member.role} onChange={(role) => handleRoleChange(member.user_id, role)} disabled={isPending} />
              ) : (
                <Badge variant="secondary">{ROLE_LABELS[member.role]}</Badge>
              )}
              {canManage && !isSelf && !isOwner && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" disabled={isPending}
                  onClick={() => handleRemove(member.user_id, member.profile.full_name ?? member.profile.email)}>
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
