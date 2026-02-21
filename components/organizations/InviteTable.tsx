'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { useSupabase } from '@/lib/supabase/context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ROLE_LABELS } from '@/lib/rbac'
import type { Invitation } from '@/types'

interface InviteTableProps {
  invitations: Invitation[]
  canManage: boolean
  onMutate: () => void
}

export function InviteTable({ invitations, canManage, onMutate }: InviteTableProps) {
  const { supabase } = useSupabase()
  const [isPending, setIsPending] = useState(false)

  const handleRevoke = async (id: string, email: string) => {
    if (!confirm(`Revoke invitation for ${email}?`)) return
    setIsPending(true)
    const { error } = await supabase.from('invitations').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Invitation revoked'); onMutate() }
    setIsPending(false)
  }

  if (invitations.length === 0) {
    return <p className="text-sm text-muted-foreground">No pending invitations.</p>
  }

  return (
    <div className="divide-y rounded-md border">
      {invitations.map((inv) => (
        <div key={inv.id} className="flex items-center gap-3 p-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{inv.email}</p>
            <p className="text-xs text-muted-foreground">
              Expires {format(new Date(inv.expires_at), 'MMM d, yyyy')}
            </p>
          </div>
          <Badge variant="outline">{ROLE_LABELS[inv.role]}</Badge>
          {canManage && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
              disabled={isPending} onClick={() => handleRevoke(inv.id, inv.email)}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
