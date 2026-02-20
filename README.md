# Next.js + Supabase SaaS Starter Template

A production-ready starter template for building SaaS applications with **Next.js 14**, **Supabase**, and **shadcn/ui**. Provides authentication, organizations, projects, RBAC, team invitations, and an onboarding wizard — all without any business-specific logic.

## Features

- **Authentication** — email/password + OAuth (Google, GitHub)
- **Organizations** — personal and team workspaces, org switcher
- **Projects** — optional multi-project mode per organization
- **RBAC** — owner / admin / member / viewer roles (org + project level)
- **Invitations** — email invite flow with expiry and one-time use
- **Onboarding wizard** — guided setup for new users
- **Mode configuration** — `solo/teams` and `single/multi-project` via env vars
- **UI scaffold** — sidebar, navigation, settings, member management

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/QUICKSTART.md](docs/QUICKSTART.md) | Get running in 10 minutes |
| [docs/MODES.md](docs/MODES.md) | Workspace and project modes explained |
| [docs/ROLES.md](docs/ROLES.md) | RBAC roles and permissions |
| [docs/INVITES.md](docs/INVITES.md) | How the invitation flow works |
| [docs/SUPABASE_SECURITY.md](docs/SUPABASE_SECURITY.md) | Security checklist for production |

## Stack

- [Next.js 14](https://nextjs.org) (App Router, TypeScript)
- [Supabase](https://supabase.com) (Auth, PostgreSQL, RLS)
- [shadcn/ui](https://ui.shadcn.com) + [Tailwind CSS](https://tailwindcss.com)
- [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev)
- [Resend](https://resend.com) (email delivery for invites)
