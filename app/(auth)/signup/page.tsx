import { Card, CardContent } from '@/components/ui/card'
import { SignupForm } from '@/components/auth/SignupForm'

export const metadata = { title: 'Create account' }

interface Props {
  searchParams: Promise<{ invite?: string }>
}

export default async function SignupPage({ searchParams }: Props) {
  const { invite } = await searchParams
  return (
    <Card>
      <CardContent className="pt-6">
        <SignupForm inviteToken={invite} />
      </CardContent>
    </Card>
  )
}
