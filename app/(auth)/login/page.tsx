import { Card, CardContent } from '@/components/ui/card'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata = { title: 'Sign in' }

export default function LoginPage() {
  return (
    <Card>
      <CardContent className="pt-6">
        <LoginForm />
      </CardContent>
    </Card>
  )
}
