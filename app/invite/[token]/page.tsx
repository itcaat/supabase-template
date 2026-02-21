'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { useSupabase } from '@/lib/supabase/context'
import { AcceptInviteButton } from '@/components/invites/AcceptInviteButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Invitation, Organization } from '@/types'

type InviteState = 'loading' | 'not_found' | 'expired' | 'accepted' | 'wrong_account' | 'ready' | 'unauthenticated'

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const { supabase, user, loading: authLoading } = useSupabase()
  const [state, setState] = useState<InviteState>('loading')
  const [invitation, setInvitation] = useState<(Invitation & { organization?: Organization }) | null>(null)

  useEffect(() => {
    if (authLoading || !token) return
    const load = async () => {
      const { data, error } = await supabase
        .from('invitations')
        .select('*, organization:organizations(name, slug)')
        .eq('token', token)
        .single()

      if (error || !data) { setState('not_found'); return }

      setInvitation(data as Invitation & { organization?: Organization })

      if (data.accepted_at) { setState('accepted'); return }
      if (new Date(data.expires_at) < new Date()) { setState('expired'); return }
      if (!user) { setState('unauthenticated'); return }
      if (user.email !== data.email) { setState('wrong_account'); return }
      setState('ready')
    }
    load()
  }, [token, user, authLoading, supabase])

  const orgName = (invitation?.organization as { name: string } | null)?.name ?? 'the organization'

  if (state === 'loading' || authLoading) {
    return <InviteLayout><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64 mt-3" /></InviteLayout>
  }

  if (state === 'not_found') return (
    <InviteLayout>
      <XCircle className="h-10 w-10 text-destructive mb-4" />
      <h1 className="text-xl font-bold">Invitation not found</h1>
      <p className="text-muted-foreground text-sm mt-1">This invitation link is invalid or has been removed.</p>
      <Button asChild className="mt-6"><Link href="/">Go home</Link></Button>
    </InviteLayout>
  )

  if (state === 'accepted') return (
    <InviteLayout>
      <CheckCircle2 className="h-10 w-10 text-green-500 mb-4" />
      <h1 className="text-xl font-bold">Already accepted</h1>
      <p className="text-muted-foreground text-sm mt-1">This invitation has already been used.</p>
      <Button asChild className="mt-6"><Link href="/dashboard">Go to dashboard</Link></Button>
    </InviteLayout>
  )

  if (state === 'expired') return (
    <InviteLayout>
      <Clock className="h-10 w-10 text-muted-foreground mb-4" />
      <h1 className="text-xl font-bold">Invitation expired</h1>
      <p className="text-muted-foreground text-sm mt-1">This invitation has expired. Please ask for a new one.</p>
    </InviteLayout>
  )

  if (state === 'unauthenticated') return (
    <InviteLayout>
      <h1 className="text-xl font-bold">You&apos;ve been invited</h1>
      <p className="text-muted-foreground text-sm mt-1">
        Join <strong>{orgName}</strong> as a <strong>{invitation?.role}</strong>.
      </p>
      <p className="text-muted-foreground text-sm mt-4">Sign in or create an account to accept.</p>
      <div className="flex gap-3 mt-6 w-full">
        <Button asChild variant="outline" className="flex-1"><Link href={`/login?invite=${token}`}>Sign in</Link></Button>
        <Button asChild className="flex-1"><Link href={`/signup?invite=${token}`}>Sign up</Link></Button>
      </div>
    </InviteLayout>
  )

  if (state === 'wrong_account') return (
    <InviteLayout>
      <XCircle className="h-10 w-10 text-destructive mb-4" />
      <h1 className="text-xl font-bold">Wrong account</h1>
      <p className="text-muted-foreground text-sm mt-1">
        This invitation was sent to <strong>{invitation?.email}</strong>, but you&apos;re signed in as{' '}
        <strong>{user?.email}</strong>.
      </p>
      <Button asChild variant="outline" className="mt-6"><Link href="/login">Switch account</Link></Button>
    </InviteLayout>
  )

  return (
    <InviteLayout>
      <h1 className="text-xl font-bold">You&apos;ve been invited!</h1>
      <p className="text-muted-foreground text-sm mt-1">
        Join <strong>{orgName}</strong> as a <strong>{invitation?.role}</strong>.
      </p>
      <AcceptInviteButton token={token} className="mt-6 w-full" />
    </InviteLayout>
  )
}

function InviteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">{children}</CardContent>
      </Card>
    </div>
  )
}
