import type { MemberRole, PermissionAction } from '@/types'

const PERMISSIONS: Record<MemberRole, PermissionAction[]> = {
  owner: ['manage_org', 'manage_members', 'manage_projects', 'invite_members', 'edit', 'view', 'delete_org'],
  admin: ['manage_members', 'manage_projects', 'invite_members', 'edit', 'view'],
  member: ['edit', 'view'],
  viewer: ['view'],
}

export function canDo(role: MemberRole | null | undefined, action: PermissionAction): boolean {
  if (!role) return false
  return PERMISSIONS[role]?.includes(action) ?? false
}

export function getRolePermissions(role: MemberRole): PermissionAction[] {
  return PERMISSIONS[role] ?? []
}

export const ROLE_LABELS: Record<MemberRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
}

export const ROLE_DESCRIPTIONS: Record<MemberRole, string> = {
  owner: 'Full control over the organization and all projects',
  admin: 'Manage members and projects, but cannot delete the organization',
  member: 'Can create and edit content within projects',
  viewer: 'Read-only access to organization content',
}

export const ASSIGNABLE_ROLES: MemberRole[] = ['admin', 'member', 'viewer']
export const ALL_ROLES: MemberRole[] = ['owner', 'admin', 'member', 'viewer']

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role as MemberRole] ?? role
}
