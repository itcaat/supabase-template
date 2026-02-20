# Invitation Flow

This document describes how the invitation system works end-to-end.

---

## Overview

```
Admin → createInvitation() → DB row + Resend email → /invite/[token]
                                                         ↓
                                               User clicks link
                                                         ↓
                                         Is user logged in? ─── No ──→ /login or /signup?invite=[token]
                                                         ↓ Yes              ↓ (after auth)
                                              Email matches? ─── No ──→ Error: wrong account
                                                         ↓ Yes
                                                 acceptInvitation() RPC
                                                         ↓
                                           Added to org_members + project_members
                                                         ↓
                                              Redirect to org dashboard
```

---

## Creating an invitation

Admins and owners can invite users from the **Members** page of any organization.

What happens server-side (`createInvitation` action):
1. Validates that no unexpired pending invite exists for that email
2. Inserts a row into `invitations` with:
   - A UUID token (unique per invite)
   - 7-day expiry (`expires_at = NOW() + INTERVAL '7 days'`)
   - The inviting user's ID
   - Target role
3. Sends an email via Resend with a link to `/invite/[token]`

---

## Invitation link behavior

The `/invite/[token]` page handles four states:

| State | Behavior |
|-------|----------|
| Token not found | Error: "Invitation not found" |
| Already accepted | Info: "Already accepted" |
| Expired | Error: "Invitation expired" |
| Valid, user not logged in | Prompt to sign in or sign up |
| Valid, wrong account logged in | Error: "Wrong account" |
| Valid, correct user logged in | Show "Accept invitation" button |

---

## Accepting an invitation

When the user clicks "Accept invitation":

1. Calls the `accept_invitation(token)` Postgres RPC function
2. The function:
   - Verifies the token exists and is not expired or already accepted
   - Verifies the logged-in user's email matches the invitation email
   - Inserts into `organization_members` (upserts if already a member, updating role)
   - If the invite is project-specific, also inserts into `project_members`
   - Sets `accepted_at = NOW()` on the invitation (one-time use enforcement)
3. User is redirected to the org dashboard

---

## New user sign-up via invite

If the invited user doesn't have an account:

1. They land on `/invite/[token]` → shown login/signup prompt
2. They click "Sign up" → redirected to `/signup?invite=[token]`
3. After creating an account, the `handle_new_user` trigger runs (creates profile + personal org)
4. The app redirects to onboarding, which completes setup
5. After onboarding, user should revisit the invite link (consider storing the token in localStorage or session for auto-accept)

> **Implementation note**: Auto-accepting after signup is not implemented by default. You can add this by reading the `invite` query param in the onboarding wizard's `DoneStep` and calling `acceptInvitation` before redirecting.

---

## Invitation expiry and revocation

- Invitations expire automatically after **7 days**
- Admins can revoke pending invitations from the Members page (deletes the DB row)
- Expired invitations are excluded from the pending invites list in the UI
- A revoked or expired invitation cannot be accepted (the RPC validates this)

---

## Project-level invitations

Currently the `InviteForm` component invites users to an organization. To invite to a specific project, pass the `projectId` prop to `InviteForm`. The invite email and accept flow handle both cases.

---

## Email delivery

Emails are sent via [Resend](https://resend.com). Configure:

```env
RESEND_API_KEY=re_your_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=YourApp
```

You must verify your domain in the Resend dashboard for production use.
