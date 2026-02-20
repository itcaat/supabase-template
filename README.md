# Next.js + Supabase SaaS Starter Template

A production-ready starter template for building SaaS applications. Clone it, configure two env vars, and you immediately get auth, organizations, RBAC, team invites, and an onboarding wizard — with zero business-specific logic baked in.

<br/>

## Stack

| | |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) — App Router, TypeScript, Server Actions |
| **Backend** | [Supabase](https://supabase.com) — Auth, PostgreSQL, Row Level Security |
| **UI** | [shadcn/ui](https://ui.shadcn.com) + [Tailwind CSS](https://tailwindcss.com) |
| **Forms** | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| **Email** | [Resend](https://resend.com) — invite emails |

<br/>

## What's included

### Authentication
- Email / password sign-up and sign-in
- Google and GitHub OAuth (plug in credentials, works out of the box)
- Password reset via email link
- Auth callback route, session refresh middleware

### Organizations (Workspaces)
- Every user gets a **personal** organization automatically on sign-up (via DB trigger)
- Create additional **team** organizations
- Org switcher in the sidebar — active org persisted in a cookie
- Organization settings (rename, delete with confirmation)

### Projects
- Each organization has projects. Two modes (see below):
  - **Single** — one hidden default project, project UI invisible
  - **Multi** — full project management UI, create / delete projects

### RBAC — Roles & Permissions
Four roles at both org and project level: `owner` · `admin` · `member` · `viewer`

| Action | Owner | Admin | Member | Viewer |
|--------|:-----:|:-----:|:------:|:------:|
| View content | ✓ | ✓ | ✓ | ✓ |
| Edit content | ✓ | ✓ | ✓ | |
| Invite members | ✓ | ✓ | | |
| Manage members / roles | ✓ | ✓ | | |
| Create / manage projects | ✓ | ✓ | | |
| Update org settings | ✓ | ✓ | | |
| Delete organization | ✓ | | | |

Enforced at the **database level** (Row Level Security) and mirrored in the UI.

### Team Invitations
- Invite by email with role assignment
- 7-day expiry, one-time use token
- Invite link: `/invite/[token]` — handles all edge cases (expired, wrong account, already accepted)
- Revoke pending invitations
- Email sent via Resend

### Onboarding Wizard
5-step guided setup for every new user:

```
Welcome → Name workspace → Create project → Invite team → Done
```

Steps skip automatically based on selected modes (solo skips invite, single-project skips project creation).

### App Shell
- Sidebar with org switcher, mode-aware navigation, user menu
- Settings: user profile, password change
- Org settings: name, danger zone

<br/>

## Mode configuration

Two env vars drive the entire product mode — no code changes needed:

```env
# Who uses the app?
NEXT_PUBLIC_WORKSPACE_MODE=teams   # solo | teams

# How is work organized?
NEXT_PUBLIC_PROJECT_MODE=single    # single | multi
```

| `WORKSPACE_MODE` | `PROJECT_MODE` | Typical use case |
|---|---|---|
| `solo` | `single` | Personal dashboard / internal tool |
| `solo` | `multi` | Personal project tracker |
| `teams` | `single` | Simple SaaS (one workspace per customer) |
| `teams` | `multi` | Project-based platform (Jira, Linear style) |

<br/>

## Project structure

```
app/
  (auth)/           login · signup · reset-password
  (app)/
    onboarding/     5-step wizard
    dashboard/      redirects to active org
    org/[slug]/     org dashboard · members · projects · settings
    settings/       user profile
  auth/callback/    OAuth callback route
  invite/[token]/   invitation accept page
  actions/          server actions (auth, orgs, projects, invites, profile)

components/
  auth/             LoginForm · SignupForm · OAuthButton
  onboarding/       WizardShell + 5 step components
  organizations/    OrgSwitcher · MemberTable · InviteForm · RoleSelector · ...
  projects/         ProjectCard · CreateProjectDialog
  settings/         ProfileSettingsForm · PasswordChangeForm
  shared/           Sidebar · UserMenu · EmptyState
  ui/               shadcn/ui primitives

lib/
  supabase/         client.ts · server.ts · middleware.ts
  rbac.ts           canDo(role, action) + getRoleLabel helpers
  config.ts         isTeamsMode() / isMultiProjectMode() from env vars
  invites.ts        sendInviteEmail (Resend) + slugify

supabase/
  migrations/
    001_schema.sql  6 tables + indexes + updated_at triggers
    002_rls.sql     Row Level Security policies (all tables)
    003_functions.sql  handle_new_user trigger · accept_invitation RPC · get_user_organizations RPC
  seed.sql

types/index.ts      shared TypeScript types
middleware.ts       auth guard + onboarding redirect
```

<br/>

## Database schema

```
profiles              ← extends auth.users
organizations         ← personal | team
organization_members  ← org_id + user_id + role
projects              ← belongs to org, has is_default flag
project_members       ← project_id + user_id + role
invitations           ← token + expiry + accepted_at (one-time use)
```

On sign-up, a Postgres trigger automatically creates the user's profile, personal organization, default project, and owner membership — no extra API calls needed.

<br/>

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/itcaat/supabase-template.git my-app
cd my-app
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_WORKSPACE_MODE=teams   # solo | teams
NEXT_PUBLIC_PROJECT_MODE=single    # single | multi

NEXT_PUBLIC_APP_URL=http://localhost:3000

RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=MyApp
```

### 3. Apply migrations

Run in the Supabase SQL editor (in order):

1. `supabase/migrations/001_schema.sql`
2. `supabase/migrations/002_rls.sql`
3. `supabase/migrations/003_functions.sql`

Or with the Supabase CLI:

```bash
supabase link --project-ref your-project-ref
supabase db push
```

### 4. Configure Supabase Auth

In your Supabase dashboard → **Authentication → URL Configuration**:
- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up, and go through the onboarding wizard.

<br/>

## Documentation

| | |
|---|---|
| [docs/QUICKSTART.md](docs/QUICKSTART.md) | Full setup guide including Vercel deployment |
| [docs/MODES.md](docs/MODES.md) | Workspace and project modes in detail |
| [docs/ROLES.md](docs/ROLES.md) | RBAC roles, permissions, and how to extend them |
| [docs/INVITES.md](docs/INVITES.md) | Invite flow end-to-end, edge cases, new user sign-up |
| [docs/SUPABASE_SECURITY.md](docs/SUPABASE_SECURITY.md) | Pre-production security checklist |

<br/>

## Extending the template

This template has **no business logic**. To build your product on top of it:

1. Add your own tables in a new migration (e.g. `004_tasks.sql`)
2. Scope them to `org_id` or `project_id` and add RLS policies
3. Build your feature pages inside `app/(app)/org/[slug]/`
4. Use `canDo(userRole, action)` from `lib/rbac.ts` to gate UI elements
5. (Optional) Add billing by integrating Stripe alongside the org model

Common additions: tasks, documents, audit logs, subscriptions, webhooks, API keys.
