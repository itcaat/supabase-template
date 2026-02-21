'use client'

import { Sparkles } from 'lucide-react'
import { useSupabase } from '@/lib/supabase/context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface WelcomeStepProps { onNext: () => void }

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const { profile } = useSupabase()
  const name = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <Card>
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-4">
          <Sparkles className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-2xl">Welcome, {name}!</CardTitle>
        <CardDescription>Let&apos;s get your workspace set up in just a few steps.</CardDescription>
      </CardHeader>
      <CardContent />
      <CardFooter>
        <Button className="w-full" onClick={onNext}>Get started</Button>
      </CardFooter>
    </Card>
  )
}
