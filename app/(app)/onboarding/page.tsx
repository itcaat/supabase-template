import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WizardShell } from '@/components/onboarding/WizardShell'

export const metadata = { title: 'Setup' }

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // If already onboarded, go to dashboard
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()

  if (profile?.onboarding_completed) redirect('/dashboard')

  // Get personal org (created automatically on signup)
  const { data: orgsData } = await supabase.rpc('get_user_organizations')
  const orgs = orgsData ?? []
  const personalOrg = orgs.find((o: { type: string }) => o.type === 'personal') ?? orgs[0]

  if (!personalOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Setting up your account… please wait.</p>
      </div>
    )
  }

  return <WizardShell personalOrg={personalOrg} />
}
