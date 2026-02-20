'use client'

import { useState } from 'react'
import { Users, User, FolderOpen, Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { WorkspaceMode, ProjectMode } from '@/types'

interface WelcomeStepProps {
  defaultMode: WorkspaceMode
  defaultProjectMode: ProjectMode
  onNext: (mode: WorkspaceMode, projectMode: ProjectMode) => void
}

function OptionCard({
  selected,
  onClick,
  icon: Icon,
  title,
  description,
}: {
  selected: boolean
  onClick: () => void
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-lg border-2 p-4 text-left transition-colors',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-muted-foreground/30',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-0.5 rounded-md p-1.5',
            selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
    </button>
  )
}

export function WelcomeStep({ defaultMode, defaultProjectMode, onNext }: WelcomeStepProps) {
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>(defaultMode)
  const [projectMode, setProjectMode] = useState<ProjectMode>(defaultProjectMode)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Welcome! Let&apos;s set up your workspace</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Choose how you plan to use this application. You can adjust these later.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">How will you use this app?</p>
        <div className="grid gap-2">
          <OptionCard
            selected={workspaceMode === 'solo'}
            onClick={() => setWorkspaceMode('solo')}
            icon={User}
            title="Solo"
            description="Just me — personal projects, no team collaboration needed"
          />
          <OptionCard
            selected={workspaceMode === 'teams'}
            onClick={() => setWorkspaceMode('teams')}
            icon={Users}
            title="Teams"
            description="Working with a team — invite members, assign roles, collaborate"
          />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">How do you want to organize work?</p>
        <div className="grid gap-2">
          <OptionCard
            selected={projectMode === 'single'}
            onClick={() => setProjectMode('single')}
            icon={Folder}
            title="Single workspace"
            description="Keep everything in one place — simple and focused"
          />
          <OptionCard
            selected={projectMode === 'multi'}
            onClick={() => setProjectMode('multi')}
            icon={FolderOpen}
            title="Multiple projects"
            description="Organize work into separate projects within your workspace"
          />
        </div>
      </div>

      <Button className="w-full" onClick={() => onNext(workspaceMode, projectMode)}>
        Continue
      </Button>
    </div>
  )
}
