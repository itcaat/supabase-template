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
  const [supabase] = useState(() => createClient())
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [organizations, setOrganizations] = useState<OrgWithRole[]>([])
  const [currentOrg, setCurrentOrgState] = useState<OrgWithRole | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user)
        await Promise.all([fetchProfile(session.user.id), fetchOrgs()])
      } else {
        setUser(null)
        setProfile(null)
        setOrganizations([])
        setCurrentOrgState(null)
      }
      setLoading(false)
    })
    return () => subscription.unsubscribe()
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
          user ? fetchProfile(user.id).then(() => {}) : Promise.resolve(),
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
