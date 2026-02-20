# Workspace and Project Modes

The template supports two independent mode axes, configured via environment variables. Modes affect both the UI and system behavior — no code changes required.

---

## Workspace Mode

```env
NEXT_PUBLIC_WORKSPACE_MODE=teams   # or: solo
```

### `solo` mode

- Designed for single-user or personal-tool use cases
- Invitation UI is hidden from the interface
- RBAC is still enforced in the database, but the UI doesn't expose role management
- The user's personal organization is the primary workspace
- Suitable for: personal dashboards, internal tools for one person

### `teams` mode (default)

- Full multi-user collaboration
- Invite teammates by email, assign roles
- Role management UI is visible to owners and admins
- Multiple users can belong to the same organization
- Suitable for: SaaS products, team tools, agency/client platforms

---

## Project Mode

```env
NEXT_PUBLIC_PROJECT_MODE=single   # or: multi
```

### `single` mode (default)

- Each organization has exactly one default project (created automatically)
- The project layer is **invisible** in the UI — users work "inside the organization"
- Suitable for: simple SaaS where the org = the product unit

### `multi` mode

- Organizations can contain multiple named projects
- A **Projects** section appears in the sidebar navigation
- Users can create, manage, and switch between projects
- Project-level RBAC applies independently of org-level roles
- Suitable for: project management tools, agencies, developer platforms

---

## Combining modes

| `WORKSPACE_MODE` | `PROJECT_MODE` | Use case example |
|---|---|---|
| `solo` | `single` | Personal notes app, personal finance tool |
| `solo` | `multi` | Personal project tracker |
| `teams` | `single` | Simple SaaS (Notion-like, one workspace per org) |
| `teams` | `multi` | Jira-like (org has multiple projects, each with members) |

---

## Changing modes after launch

Modes are read from environment variables at runtime. You can change them without database migrations. However:

- Switching from `single` to `multi` may require UI adjustments since users will now see existing hidden default projects
- Switching from `teams` to `solo` hides invite UI but does not remove existing members
- It's safe to experiment with modes in development
