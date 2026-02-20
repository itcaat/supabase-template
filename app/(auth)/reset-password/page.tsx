'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { toast } from 'sonner'
import { resetPassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

const schema = z.object({ email: z.string().email('Invalid email') })
type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const [isPending, startTransition] = useTransition()
  const [sent, setSent] = useTransition()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.append('email', data.email)
      const result = await resetPassword(formData)
      if (result?.error) toast.error(result.error)
      else toast.success(result?.message ?? 'Check your email!')
    })
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Reset password</h1>
          <p className="text-muted-foreground text-sm">
            Enter your email and we&apos;ll send a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
            {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-foreground font-medium hover:underline">
            Back to login
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
