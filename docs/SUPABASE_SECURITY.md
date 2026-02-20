# Supabase Security Checklist

Before going to production, go through this checklist to ensure your Supabase project is properly secured.

---

## Authentication

- [ ] **Email confirmation enabled** — Go to Auth → Settings → Enable "Confirm email" to prevent fake accounts
- [ ] **Password minimum length** — Set at least 8 characters in Auth → Settings
- [ ] **Rate limiting** — Supabase applies rate limiting by default; review limits for your expected traffic
- [ ] **OAuth providers secured** — If using Google/GitHub OAuth:
  - Add only your production domain to the OAuth app's allowed redirect URIs
  - Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client
- [ ] **Session duration** — Review JWT expiry and refresh token TTL (Auth → Settings)

---

## Row Level Security (RLS)

- [ ] **RLS enabled on all tables** — Verify each table has RLS enabled:
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
  ```
  All should show `rowsecurity = true`.

- [ ] **No public read policies unless intentional** — Review all `FOR SELECT` policies to ensure they require `auth.uid()`

- [ ] **Functions use SECURITY DEFINER carefully** — The `handle_new_user` and `accept_invitation` functions run as the DB owner. They are scoped to `SET search_path = public` to prevent schema injection. Audit any new SECURITY DEFINER functions.

- [ ] **Test RLS as different roles** — Use the Supabase Table Editor "Auth" toggle to test queries as different users, or use `SET ROLE` in SQL

---

## Environment Variables

- [ ] **`SUPABASE_SERVICE_ROLE_KEY` is server-only** — Never expose this in client code or `NEXT_PUBLIC_` variables. It bypasses all RLS.

- [ ] **`.env.local` is in `.gitignore`** — Never commit secrets to git

- [ ] **Production secrets are set in deployment platform** — Use Vercel, Railway, or similar environment variable management

---

## Database

- [ ] **Disable direct database access** — In Supabase dashboard, go to Settings → Database → Connection pooling. Consider disabling direct connections if not needed.

- [ ] **Enable Point-in-Time Recovery (PITR)** — Available on Pro plan for disaster recovery

- [ ] **Review database roles** — The `anon` and `authenticated` roles should not have superuser privileges

- [ ] **Audit `public` schema permissions** — Ensure `anon` cannot access tables it shouldn't:
  ```sql
  REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
  ```
  (Supabase does this by default, but verify after any custom migrations)

---

## API

- [ ] **Anon key is safe to expose** — `NEXT_PUBLIC_SUPABASE_ANON_KEY` is designed to be public; it's restricted by RLS and Auth policies

- [ ] **Restrict PostgREST access** — In Supabase dashboard, go to API → Settings. Limit which schemas are exposed via API.

- [ ] **Use Supabase Edge Functions for sensitive logic** — Rather than exposing service role actions through the client

---

## Network

- [ ] **Custom domain** — Consider setting a custom domain for your Supabase project (Pro plan) to avoid dependency on `supabase.co` in your auth URLs

- [ ] **CORS** — Supabase restricts CORS to your Site URL and Redirect URLs. Keep these list minimal.

---

## Monitoring

- [ ] **Enable Supabase Logs** — Monitor Auth events, API calls, and database queries in the Logs section

- [ ] **Set up alerts** — Consider third-party monitoring (Sentry, Datadog) for your Next.js app

- [ ] **Review Auth activity** — Periodically check Auth → Users for suspicious sign-ups

---

## Before each deployment

1. Run `npm run build` locally and fix any TypeScript/lint errors
2. Verify all environment variables are set in your deployment platform
3. Test the invite flow end-to-end in staging
4. Confirm RLS is enabled on all new tables added since last deployment
