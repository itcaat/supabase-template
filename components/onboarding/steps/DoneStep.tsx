'use client'

import { useTransition } from 'react'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DoneStepProps {
  orgSlug: string
  onFinish: () => void
}

export function DoneStep({ orgSlug, onFinish }: DoneStepProps) {
  const [isPending, startTransition] = useTransition()

  const handleFinish = () => {
    startTransition(async () => {
      await onFinish()
    })
  }

  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center py-4">
        <div className="rounded-full bg-green-50 p-4 mb-4 dark:bg-green-950">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-xl font-bold">You&apos;re all set!</h2>
        <p className="text-muted-foreground text-sm mt-2 max-w-sm">
          Your workspace is ready. Let&apos;s get to work.
        </p>
      </div>

      <Button className="w-full" onClick={handleFinish} disabled={isPending}>
        {isPending ? 'Loading…' : (
          <>
            Go to workspace
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  )
}
