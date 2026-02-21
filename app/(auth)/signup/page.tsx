import { Card, CardContent } from '@/components/ui/card'
import { SignupForm } from '@/components/auth/SignupForm'

export const metadata = { title: 'Create account' }

export default function SignupPage() {
  return (
    <Card>
      <CardContent className="pt-6">
        <SignupForm />
      </CardContent>
    </Card>
  )
}
