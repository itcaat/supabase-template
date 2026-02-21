'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useSupabase } from '@/lib/supabase/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })
type FormData = z.infer<typeof schema>

export function PasswordChangeForm() {
  const { supabase } = useSupabase()
  const [isPending, setIsPending] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setIsPending(true)
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) toast.error(error.message)
    else { toast.success('Password updated'); reset() }
    setIsPending(false)
  }

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold">Change password</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
          {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" type="password" placeholder="••••••••" {...register('confirm')} />
          {errors.confirm && <p className="text-destructive text-xs">{errors.confirm.message}</p>}
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </section>
  )
}
