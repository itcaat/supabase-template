'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { toast } from 'sonner'
import { useSupabase } from '@/lib/supabase/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { OAuthButton } from './OAuthButton'

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type FormData = z.infer<typeof schema>

function SignupFormInner() {
  const { supabase } = useSupabase()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')
  const [isPending, setIsPending] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setIsPending(true)
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name },
        emailRedirectTo: `${window.location.origin}/auth/callback${inviteToken ? `?invite=${inviteToken}` : ''}`,
      },
    })
    if (error) toast.error(error.message)
    else toast.success('Check your email to confirm your account.')
    setIsPending(false)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-muted-foreground text-sm">
          {inviteToken ? "You've been invited — sign up to accept" : 'Start your free trial today'}
        </p>
      </div>

      <div className="space-y-3">
        <OAuthButton provider="google" label="Continue with Google" />
        <OAuthButton provider="github" label="Continue with GitHub" />
      </div>

      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
          or
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" placeholder="Jane Doe" autoComplete="name" {...register('full_name')} />
          {errors.full_name && <p className="text-destructive text-xs">{errors.full_name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} />
          {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="••••••••" autoComplete="new-password" {...register('password')} />
          {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-foreground font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  )
}

export function SignupForm() {
  return (
    <Suspense>
      <SignupFormInner />
    </Suspense>
  )
}
