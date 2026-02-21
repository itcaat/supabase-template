'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useSupabase } from '@/lib/supabase/context'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AcceptInviteButtonProps {
  token: string
  className?: string
}

export function AcceptInviteButton({ token, className }: AcceptInviteButtonProps) {
  const { supabase, refreshOrgs } = useSupabase()
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const handleAccept = async () => {
    setIsPending(true)
    const { data, error } = await supabase.rpc('accept_invitation', { invitation_token: token })
    if (error) { toast.error(error.message); setIsPending(false); return }
    if (!data?.success) { toast.error('Failed to accept invitation'); setIsPending(false); return }
    toast.success('Invitation accepted!')
    await refreshOrgs()
    router.push('/dashboard')
  }

  return (
    <Button onClick={handleAccept} disabled={isPending} className={cn(className)}>
      {isPending ? 'Accepting…' : 'Accept invitation'}
    </Button>
  )
}
