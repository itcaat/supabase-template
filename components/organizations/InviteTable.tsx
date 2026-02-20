'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { revokeInvitation } from '@/app/actions/invites'
import { ROLE_LABELS } from '@/lib/rbac'
import type { Invitation, MemberRole } from '@/types'

interface InviteTableProps {
  invitations: Invitation[]
  canManage: boolean
}

function timeUntil(date: string): string {
  const diff = new Date(date).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const days = Math.floor(diff / 86400000)
  if (days > 0) return `${days}d left`
  const hours = Math.floor(diff / 3600000)
  return `${hours}h left`
}

export function InviteTable({ invitations, canManage }: InviteTableProps) {
  const [isPending, startTransition] = useTransition()

  const handleRevoke = (id: string, email: string) => {
    if (!confirm(`Revoke invitation for ${email}?`)) return
    startTransition(async () => {
      const result = await revokeInvitation(id)
      if (result?.error) toast.error(result.error)
      else toast.success('Invitation revoked')
    })
  }

  if (invitations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No pending invitations
      </p>
    )
  }

  return (
    <div className="divide-y rounded-md border">
      {invitations.map((inv) => (
        <div key={inv.id} className="flex items-center gap-3 p-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{inv.email}</p>
            <p className="text-xs text-muted-foreground">{timeUntil(inv.expires_at)}</p>
          </div>
          <Badge variant="secondary">{ROLE_LABELS[inv.role]}</Badge>
          {canManage && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => handleRevoke(inv.id, inv.email)}
              disabled={isPending}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
