# Quick Start

Get the template running locally in about 10 minutes.

## Prerequisites

- Node.js 18+
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) (for local dev)
- A Supabase project (free tier works)
- A [Resend](https://resend.com) account (for invite emails)

---

## 1. Clone and install

```bash
git clone https://github.com/your-org/supabase-template.git my-app
cd my-app
npm install
```

---

## 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY is not required by this template

NEXT_PUBLIC_WORKSPACE_MODE=teams    # solo | teams
NEXT_PUBLIC_PROJECT_MODE=single     # single | multi

NEXT_PUBLIC_APP_URL=http://localhost:3000

RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=MyApp
```

You can find your Supabase keys in the project dashboard under
**Settings → API**.

---

## 3. Apply database migrations

### Option A: Supabase Cloud (dashboard SQL editor)

Run the following files in order in the Supabase SQL editor:

1. `supabase/migrations/001_schema.sql`
2. `supabase/migrations/002_rls.sql`
3. `supabase/migrations/003_functions.sql`

### Option B: Supabase CLI (local dev)

```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

---

## 4. Configure Supabase Auth

In your Supabase dashboard:

1. Go to **Authentication → URL Configuration**
2. Set **Site URL** to `http://localhost:3000`
3. Add to **Redirect URLs**: `http://localhost:3000/auth/callback`

For OAuth (optional):
- Go to **Authentication → Providers**
- Enable Google and/or GitHub, add your OAuth credentials

---

## 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up.

The `handle_new_user` trigger automatically creates:
- A profile
- A personal organization
- A default project
- An owner membership

You'll be routed through the onboarding wizard on first login.

---

## 6. Deploy to production

### Vercel (recommended)

```bash
npx vercel --prod
```

Set environment variables in the Vercel dashboard, and update:
- `NEXT_PUBLIC_APP_URL` to your production URL
- Supabase **Site URL** and **Redirect URLs** to your production domain
