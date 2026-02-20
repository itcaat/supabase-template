import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AcceptInviteButton } from '@/components/invites/AcceptInviteButton'

interface Props {
  params: Promise<{ token: string }>
}

export const metadata = { title: 'Accept invitation' }

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch invitation details
  const { data: invitation, error } = await supabase
    .from('invitations')
    .select('*, organization:organizations(name, slug)')
    .eq('token', token)
    .single()

  if (error || !invitation) {
    return (
      <InviteLayout>
        <XCircle className="h-10 w-10 text-destructive mb-4" />
        <h1 className="text-xl font-bold">Invitation not found</h1>
        <p className="text-muted-foreground text-sm mt-1">
          This invitation link is invalid or has been removed.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Go home</Link>
        </Button>
      </InviteLayout>
    )
  }

  if (invitation.accepted_at) {
    return (
      <InviteLayout>
        <CheckCircle2 className="h-10 w-10 text-green-500 mb-4" />
        <h1 className="text-xl font-bold">Already accepted</h1>
        <p className="text-muted-foreground text-sm mt-1">
          This invitation has already been accepted.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </InviteLayout>
    )
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return (
      <InviteLayout>
        <Clock className="h-10 w-10 text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold">Invitation expired</h1>
        <p className="text-muted-foreground text-sm mt-1">
          This invitation expired on{' '}
          {new Date(invitation.expires_at).toLocaleDateString()}.
          Please ask for a new invite.
        </p>
      </InviteLayout>
    )
  }

  const orgName = (invitation.organization as { name: string } | null)?.name ?? 'the organization'

  if (!user) {
    return (
      <InviteLayout>
        <h1 className="text-xl font-bold">You&apos;ve been invited</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Join <strong>{orgName}</strong> as a <strong>{invitation.role}</strong>.
        </p>
        <p className="text-muted-foreground text-sm mt-4">
          Sign in or create an account to accept this invitation.
        </p>
        <div className="flex gap-3 mt-6 w-full">
          <Button asChild variant="outline" className="flex-1">
            <Link href={`/login?invite=${token}`}>Sign in</Link>
          </Button>
          <Button asChild className="flex-1">
            <Link href={`/signup?invite=${token}`}>Sign up</Link>
          </Button>
        </div>
      </InviteLayout>
    )
  }

  // Check if user email matches
  const userEmail = user.email ?? ''
  if (userEmail !== invitation.email) {
    return (
      <InviteLayout>
        <XCircle className="h-10 w-10 text-destructive mb-4" />
        <h1 className="text-xl font-bold">Wrong account</h1>
        <p className="text-muted-foreground text-sm mt-1">
          This invitation was sent to <strong>{invitation.email}</strong>, but you&apos;re
          signed in as <strong>{userEmail}</strong>.
        </p>
        <p className="text-muted-foreground text-sm mt-3">
          Sign out and sign in with the correct account, or ask for a new invite.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/login">Switch account</Link>
        </Button>
      </InviteLayout>
    )
  }

  return (
    <InviteLayout>
      <h1 className="text-xl font-bold">You&apos;ve been invited!</h1>
      <p className="text-muted-foreground text-sm mt-1">
        Join <strong>{orgName}</strong> as a <strong>{invitation.role}</strong>.
      </p>
      <AcceptInviteButton token={token} className="mt-6 w-full" />
    </InviteLayout>
  )
}

function InviteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
          {children}
        </CardContent>
      </Card>
    </div>
  )
}
