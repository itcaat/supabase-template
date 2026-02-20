import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface SendInviteEmailOptions {
  to: string
  inviterName: string
  orgName: string
  projectName?: string
  role: string
  token: string
}

export async function sendInviteEmail({
  to,
  inviterName,
  orgName,
  projectName,
  role,
  token,
}: SendInviteEmailOptions): Promise<{ success: boolean; error?: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const inviteUrl = `${appUrl}/invite/${token}`
  const fromName = process.env.RESEND_FROM_NAME ?? 'App'
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@example.com'

  const context = projectName
    ? `${orgName} / ${projectName}`
    : orgName

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>You've been invited to join ${context}</h2>
      <p>
        <strong>${inviterName}</strong> has invited you to join 
        <strong>${context}</strong> as a <strong>${role}</strong>.
      </p>
      <p>
        <a href="${inviteUrl}" style="
          display: inline-block;
          background: #000;
          color: #fff;
          padding: 12px 24px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
        ">
          Accept Invitation
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">
        This invitation expires in 7 days. If you didn't expect this invitation, 
        you can safely ignore this email.
      </p>
      <p style="color: #999; font-size: 12px;">
        Or copy and paste this link: ${inviteUrl}
      </p>
    </div>
  `

  try {
    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject: `You've been invited to join ${context}`,
      html,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send invite email:', error)
    return { success: false, error: 'Failed to send invitation email' }
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
