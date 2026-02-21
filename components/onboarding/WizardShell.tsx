'use client'

import { useState } from 'react'
import { WelcomeStep } from './steps/WelcomeStep'
import { OrgStep } from './steps/OrgStep'
import { ProjectStep } from './steps/ProjectStep'
import { InviteStep } from './steps/InviteStep'
import { DoneStep } from './steps/DoneStep'
import type { OrgWithRole } from '@/lib/supabase/context'

interface WizardShellProps {
  personalOrg: OrgWithRole
}

export type WizardStep = 'welcome' | 'org' | 'project' | 'invite' | 'done'

export function WizardShell({ personalOrg }: WizardShellProps) {
  const [step, setStep] = useState<WizardStep>('welcome')
  const [activeOrg, setActiveOrg] = useState(personalOrg)

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-lg">
        {step === 'welcome' && <WelcomeStep onNext={() => setStep('org')} />}
        {step === 'org' && (
          <OrgStep
            defaultOrg={personalOrg}
            onNext={(org) => { setActiveOrg(org); setStep('project') }}
          />
        )}
        {step === 'project' && (
          <ProjectStep
            org={activeOrg}
            onNext={() => setStep('invite')}
            onSkip={() => setStep('invite')}
          />
        )}
        {step === 'invite' && (
          <InviteStep
            org={activeOrg}
            onNext={() => setStep('done')}
            onSkip={() => setStep('done')}
          />
        )}
        {step === 'done' && <DoneStep org={activeOrg} />}
      </div>
    </div>
  )
}
