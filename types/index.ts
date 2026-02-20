export type OrgType = 'personal' | 'team'
export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer'
export type WorkspaceMode = 'solo' | 'teams'
export type ProjectMode = 'single' | 'multi'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  type: OrgType
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  org_id: string
  user_id: string
  role: MemberRole
  created_at: string
  profile?: Profile
  organization?: Organization
}

export interface Project {
  id: string
  org_id: string
  name: string
  slug: string
  description: string | null
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: MemberRole
  created_at: string
  profile?: Profile
  project?: Project
}

export interface Invitation {
  id: string
  org_id: string
  project_id: string | null
  email: string
  role: MemberRole
  token: string
  invited_by: string | null
  expires_at: string
  accepted_at: string | null
  created_at: string
  organization?: Organization
  project?: Project
  inviter?: Profile
}

export interface AppConfig {
  workspaceMode: WorkspaceMode
  projectMode: ProjectMode
}

// Permission actions
export type PermissionAction =
  | 'manage_org'
  | 'manage_members'
  | 'manage_projects'
  | 'invite_members'
  | 'edit'
  | 'view'
  | 'delete_org'
