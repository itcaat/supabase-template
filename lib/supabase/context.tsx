'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createClient } from './client'
import type { MemberRole, Organization, Profile } from '@/types'

export interface OrgWithRole extends Organization {
  role: MemberRole
}

interface SupabaseContextValue {
  supabase: SupabaseClient
  user: User | null
  profile: Profile | null
  organizations: OrgWithRole[]
  currentOrg: OrgWithRole | null
  setCurrentOrg: (org: OrgWithRole) => void
  loading: boolean
  refreshProfile: () => Promise<void>
  refreshOrgs: () => Promise<void>
}

const SupabaseContext = createContext<SupabaseContextValue | null>(null)

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
  return match ? decodeURIComponent(match[2]) : null
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=2592000; SameSite=Lax`
}

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [organizations, setOrganizations] = useState<OrgWithRole[]>([])
  const [currentOrg, setCurrentOrgState] = useState<OrgWithRole | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(
    async (userId: string, user?: User) => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()

      if (error) {
        console.error('[fetchProfile] query error:', error.code, error.message)
      }

      // Profile missing — user signed up before migrations were applied,
      // or the handle_new_user trigger failed. Create it now from auth metadata.
      if (!data && user) {
        console.warn('[fetchProfile] profile not found, creating from auth metadata')
        const meta = user.user_metadata ?? {}
        const { error: upsertErr } = await supabase.from('profiles').upsert({
          id: userId,
          email: user.email ?? '',
          full_name: meta.full_name ?? meta.name ?? null,
          avatar_url: meta.avatar_url ?? meta.picture ?? null,
          onboarding_completed: false,
        })
        if (upsertErr) {
          console.error('[fetchProfile] upsert error:', upsertErr.code, upsertErr.message)
        }
        const { data: created, error: refetchErr } = await supabase.from('profiles').select('*').eq('id', userId).single()
        if (refetchErr) console.error('[fetchProfile] refetch error:', refetchErr.code, refetchErr.message)
        setProfile(created)
        return created as Profile | null
      }

      setProfile(data)
      return data as Profile | null
    },
    [supabase],
  )

  const fetchOrgs = useCallback(async () => {
    const { data } = await supabase.rpc('get_user_organizations')
    const orgs: OrgWithRole[] = data ?? []
    setOrganizations(orgs)
    const savedSlug = getCookie('active_org_slug')
    const found = orgs.find((o) => o.slug === savedSlug) ?? orgs[0] ?? null
    setCurrentOrgState(found)
    if (found && !savedSlug) setCookie('active_org_slug', found.slug)
    return orgs
  }, [supabase])

  useEffect(() => {
    let mounted = true

    // getSession() reads from local storage — does NOT acquire the navigator lock.
    // This avoids the lock-timeout crash React Strict Mode causes when
    // onAuthStateChange is registered twice in quick succession.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      if (session?.user) {
        setUser(session.user)
        await Promise.all([fetchProfile(session.user.id, session.user), fetchOrgs()])
      }
      if (mounted) setLoading(false)
    })

    // onAuthStateChange handles future events only; INITIAL_SESSION is already
    // covered by getSession() above, so we skip it to avoid a second lock acquisition.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return

      if (session?.user) {
        setUser(session.user)
        await Promise.all([fetchProfile(session.user.id, session.user), fetchOrgs()])
      } else {
        setUser(null)
        setProfile(null)
        setOrganizations([])
        setCurrentOrgState(null)
      }
      if (mounted) setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile, fetchOrgs, supabase])

  const setCurrentOrg = (org: OrgWithRole) => {
    setCurrentOrgState(org)
    setCookie('active_org_slug', org.slug)
  }

  return (
    <SupabaseContext.Provider
      value={{
        supabase,
        user,
        profile,
        organizations,
        currentOrg,
        setCurrentOrg,
        loading,
        refreshProfile: () =>
          user ? fetchProfile(user.id, user).then(() => {}) : Promise.resolve(),
        refreshOrgs: () => fetchOrgs().then(() => {}),
      }}
    >
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const ctx = useContext(SupabaseContext)
  if (!ctx) throw new Error('useSupabase must be used within SupabaseProvider')
  return ctx
}
