'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { acceptInvitation } from '@/app/actions/invites'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AcceptInviteButtonProps {
  token: string
  className?: string
}

export function AcceptInviteButton({ token, className }: AcceptInviteButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleAccept = () => {
    startTransition(async () => {
      const result = await acceptInvitation(token)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Invitation accepted! Welcome to the team.')
        const orgSlug = result?.orgSlug
        router.push(orgSlug ? `/org/${orgSlug}` : '/dashboard')
      }
    })
  }

  return (
    <Button onClick={handleAccept} disabled={isPending} className={cn(className)}>
      {isPending ? 'Accepting…' : 'Accept invitation'}
    </Button>
  )
}
