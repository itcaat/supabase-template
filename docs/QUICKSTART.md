# Quick Start

## Prerequisites

- Node.js ≥ 20
- A [Supabase](https://supabase.com) project (free tier works)
- A [Resend](https://resend.com) account (free tier works, for invitation emails)
- Supabase CLI installed (`npm i -g supabase`)

---

## 1. Clone and install

```bash
git clone https://github.com/itcaat/supabase-template.git
cd supabase-template
npm install
```

## 2. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these from **Supabase Dashboard → Project Settings → API**.

## 3. Set up the database

Run the migrations against your Supabase project:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Or apply them manually in the SQL Editor (in order):
1. `supabase/migrations/001_schema.sql`
2. `supabase/migrations/002_rls.sql`
3. `supabase/migrations/003_functions.sql`

## 4. Deploy the invite email Edge Function

The invitation email is sent via a **Supabase Edge Function** that calls Resend.
This keeps your Resend API key out of the browser entirely.

```bash
# Link to your project if not already done
supabase link --project-ref <your-project-ref>

# Deploy the function
supabase functions deploy send-invite-email
```

Set the required secrets in **Supabase Dashboard → Edge Functions → Secrets**
(or via CLI):

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
supabase secrets set FROM_EMAIL=noreply@yourdomain.com
supabase secrets set FROM_NAME=YourApp
supabase secrets set APP_URL=https://yourapp.com
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are
injected automatically by Supabase — you do not need to set them manually.

## 5. Set up Google OAuth (optional)

Skip this step if you only want email/password login.

### A. Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project (or select an existing one)
3. Navigate to **APIs & Services → OAuth consent screen**
   - User type: **External** → fill in app name, support email, developer email → Save
4. Navigate to **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: anything (e.g. `Supabase Template`)
   - **Authorized redirect URIs** — add:
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```
   - Click **Create** → copy the **Client ID** and **Client Secret**

### B. Supabase Dashboard

1. Go to **Authentication → Providers → Google**
2. Toggle **Enable Google provider** on
3. Paste your **Client ID** and **Client Secret**
4. Save

### C. Local development redirect

For `localhost` to work during development, also add this to the authorized redirect URIs in Google Console:

```
http://localhost:3000/auth/callback
```

And in Supabase Dashboard → **Authentication → URL Configuration**, add to **Redirect URLs**:

```
http://localhost:3000/auth/callback
```

The `OAuthButton` component in this template calls `supabase.auth.signInWithOAuth({ provider: 'google' })` — no code changes needed once the above is configured.

---

## 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Architecture: CSR + Edge Functions

This template is **client-side rendered (CSR)**:

- All pages use `'use client'` and fetch data directly from Supabase via the browser client.
- There are no Server Actions or server-side data fetching in pages.
- Auth state is managed by a single `SupabaseProvider` context at the root, available everywhere.
- The only server route is `/auth/callback` — needed to exchange OAuth/email-confirm codes for a session.

Email sending uses a **Supabase Edge Function** (`send-invite-email`):

```
browser → supabase.functions.invoke('send-invite-email') → Resend API
```

The Edge Function verifies the caller is an authenticated org admin before sending.

## Mode configuration

Set optional environment variables to toggle product modes:

```env
NEXT_PUBLIC_WORKSPACE_MODE=solo   # solo | teams (default: solo)
NEXT_PUBLIC_PROJECT_MODE=single   # single | multi (default: single)
```

See [`docs/MODES.md`](./MODES.md) for details.

---

## Deploying

### Vercel (recommended)

```bash
npx vercel
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel's
environment variable settings. Edge Function secrets stay in Supabase.

### Other platforms (Netlify, Cloudflare Pages, Railway…)

Build command: `npm run build`  
Output directory: `.next`  
Node version: ≥ 20
