import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify the calling user is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    // Use service role to read invitation details (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { invitationId } = await req.json()
    if (!invitationId) throw new Error('invitationId is required')

    // Fetch invitation + org name + inviter profile
    const { data: invitation, error: invErr } = await supabaseAdmin
      .from('invitations')
      .select('*, organization:organizations(name), inviter:profiles!invited_by(full_name, email)')
      .eq('id', invitationId)
      .single()

    if (invErr || !invitation) throw new Error('Invitation not found')

    // Verify caller is an admin of that org
    const { data: membership } = await supabaseAdmin
      .from('organization_members')
      .select('role')
      .eq('org_id', invitation.org_id)
      .eq('user_id', user.id)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      throw new Error('Only org admins can send invitations')
    }

    // Build email
    const appUrl = Deno.env.get('APP_URL') ?? 'http://localhost:3000'
    const inviteUrl = `${appUrl}/invite/${invitation.token}`
    const fromName = Deno.env.get('FROM_NAME') ?? 'App'
    const fromEmail = Deno.env.get('FROM_EMAIL') ?? 'noreply@example.com'
    const orgName = (invitation.organization as { name: string } | null)?.name ?? 'the organization'
    const inviter = invitation.inviter as { full_name: string | null; email: string } | null
    const inviterName = inviter?.full_name ?? inviter?.email ?? 'Someone'

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="margin-bottom:8px">You've been invited to join ${orgName}</h2>
        <p style="color:#555;margin-bottom:24px">
          <strong>${inviterName}</strong> has invited you to join
          <strong>${orgName}</strong> as a <strong>${invitation.role}</strong>.
        </p>
        <a href="${inviteUrl}"
           style="display:inline-block;background:#000;color:#fff;padding:12px 24px;
                  border-radius:6px;text-decoration:none;font-weight:600">
          Accept Invitation
        </a>
        <p style="color:#888;font-size:13px;margin-top:24px">
          This invitation expires in 7 days. If you weren't expecting this, you can ignore it.
        </p>
        <p style="color:#aaa;font-size:12px">Link: ${inviteUrl}</p>
      </div>
    `

    // Send via Resend
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: invitation.email,
        subject: `You've been invited to join ${orgName}`,
        html,
      }),
    })

    if (!resendRes.ok) {
      const err = await resendRes.json()
      throw new Error(`Resend error: ${JSON.stringify(err)}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
