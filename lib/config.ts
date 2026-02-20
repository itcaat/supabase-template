import type { AppConfig, WorkspaceMode, ProjectMode } from '@/types'

export function getAppConfig(): AppConfig {
  const workspaceMode = (process.env.NEXT_PUBLIC_WORKSPACE_MODE ?? 'teams') as WorkspaceMode
  const projectMode = (process.env.NEXT_PUBLIC_PROJECT_MODE ?? 'single') as ProjectMode

  return { workspaceMode, projectMode }
}

export const isTeamsMode = () => getAppConfig().workspaceMode === 'teams'
export const isMultiProjectMode = () => getAppConfig().projectMode === 'multi'
