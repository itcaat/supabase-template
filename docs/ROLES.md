# Roles and Permissions (RBAC)

The template implements a flat role-based access control system with four roles, applied at both organization and project level.

---

## Roles

| Role | Description |
|------|-------------|
| `owner` | Full control. Can delete the organization, manage all members, and perform all actions. |
| `admin` | Can manage members and projects, but cannot delete the organization. |
| `member` | Can create and edit content within the organization/project. |
| `viewer` | Read-only access. Cannot make changes. |

---

## Permission Matrix

| Action | Owner | Admin | Member | Viewer |
|--------|-------|-------|--------|--------|
| View content | ✓ | ✓ | ✓ | ✓ |
| Edit content | ✓ | ✓ | ✓ | |
| Invite members | ✓ | ✓ | | |
| Manage members (change roles, remove) | ✓ | ✓ | | |
| Create/manage projects | ✓ | ✓ | | |
| Update organization settings | ✓ | ✓ | | |
| Delete organization | ✓ | | | |

---

## Organization vs. Project roles

Roles exist at two levels independently:

- **Organization role** — applies to all actions within the organization and its settings
- **Project role** — applies to actions within a specific project

A user's org-level role does **not** automatically grant project-level access beyond what's set at the project level. Org `admin`s can manage project memberships, but a `member` of the org needs an explicit project role to access a project.

---

## How roles are enforced

### Database (Row Level Security)

All tables have RLS policies that check the current user's role before allowing operations. This is the primary security layer and cannot be bypassed by the UI.

See `supabase/migrations/002_rls.sql` for all policies.

### UI (application layer)

The `lib/rbac.ts` module exposes a `canDo(role, action)` helper:

```typescript
import { canDo } from '@/lib/rbac'

// Check if user can invite members
if (canDo(userRole, 'invite_members')) {
  // show invite UI
}
```

Available actions: `manage_org`, `manage_members`, `manage_projects`, `invite_members`, `edit`, `view`, `delete_org`

### Server actions

Server actions re-check permissions server-side even when the UI hides buttons, providing defense in depth.

---

## Auto-assigned roles

- When a user signs up, they become the `owner` of their personal organization and default project (via DB trigger)
- When inviting a user, the inviting admin chooses the role to assign
- The `owner` role can only be held by one user per org; it is not assignable via the invite form

---

## Extending roles

To add a new role or permission:

1. Add the value to the `member_role` enum in `001_schema.sql`
2. Add its permissions to `PERMISSIONS` in `lib/rbac.ts`
3. Update RLS policies in `002_rls.sql` if needed
4. Update `ROLE_LABELS` and `ROLE_DESCRIPTIONS` in `lib/rbac.ts`
