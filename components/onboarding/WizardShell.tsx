'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, Circle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { WelcomeStep } from './steps/WelcomeStep'
import { OrgStep } from './steps/OrgStep'
import { ProjectStep } from './steps/ProjectStep'
import { InviteStep } from './steps/InviteStep'
import { DoneStep } from './steps/DoneStep'
import { completeOnboarding } from '@/app/actions/profile'
import type { WorkspaceMode, ProjectMode, Organization } from '@/types'

interface WizardState {
  workspaceMode: WorkspaceMode
  projectMode: ProjectMode
  orgId: string
  orgSlug: string
}

interface WizardShellProps {
  personalOrg: Organization
}

const STEP_LABELS = ['Welcome', 'Organization', 'Projects', 'Invite', 'Done']

export function WizardShell({ personalOrg }: WizardShellProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [state, setState] = useState<Partial<WizardState>>({
    workspaceMode: 'teams',
    projectMode: 'single',
    orgId: personalOrg.id,
    orgSlug: personalOrg.slug,
  })

  const totalSteps = STEP_LABELS.length
  const progress = Math.round((step / (totalSteps - 1)) * 100)

  const next = () => setStep((s) => Math.min(s + 1, totalSteps - 1))
  const back = () => setStep((s) => Math.max(s - 1, 0))

  const handleWelcomeDone = (workspaceMode: WorkspaceMode, projectMode: ProjectMode) => {
    setState((s) => ({ ...s, workspaceMode, projectMode }))
    next()
  }

  const handleOrgDone = (orgId: string, orgSlug: string) => {
    setState((s) => ({ ...s, orgId, orgSlug }))
    next()
  }

  const handleProjectDone = () => next()

  const handleInviteDone = () => next()

  const handleFinish = async () => {
    const result = await completeOnboarding()
    if (result?.error) {
      toast.error(result.error)
      return
    }
    document.cookie = `active_org_slug=${state.orgSlug}; path=/; max-age=2592000`
    router.push(`/org/${state.orgSlug}`)
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Step indicator */}
        <div className="mb-8 space-y-3">
          <div className="flex justify-between">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium',
                    i < step
                      ? 'bg-primary text-primary-foreground'
                      : i === step
                        ? 'border-2 border-primary text-primary'
                        : 'border border-border text-muted-foreground',
                  )}
                >
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    'hidden sm:block text-xs',
                    i === step ? 'text-foreground font-medium' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Step content */}
        <div className="bg-background rounded-xl border shadow-sm p-8">
          {step === 0 && (
            <WelcomeStep
              defaultMode={state.workspaceMode!}
              defaultProjectMode={state.projectMode!}
              onNext={handleWelcomeDone}
            />
          )}
          {step === 1 && (
            <OrgStep
              personalOrg={personalOrg}
              onNext={handleOrgDone}
              onBack={back}
            />
          )}
          {step === 2 && (
            <ProjectStep
              orgId={state.orgId!}
              projectMode={state.projectMode!}
              onNext={handleProjectDone}
              onBack={back}
            />
          )}
          {step === 3 && (
            <InviteStep
              orgId={state.orgId!}
              workspaceMode={state.workspaceMode!}
              onNext={handleInviteDone}
              onBack={back}
            />
          )}
          {step === 4 && (
            <DoneStep
              orgSlug={state.orgSlug!}
              onFinish={handleFinish}
            />
          )}
        </div>
      </div>
    </div>
  )
}
