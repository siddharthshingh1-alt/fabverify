'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'
import { resolveAccount, type AccountType } from '../lib/accountType'

export type UserType =
  | 'buyer'
  | 'manufacturer'
  | 'fabric_mill'
  | 'trim_supplier'
  | 'artisan'
  | 'job_worker'
  | 'designer'
  | 'master'
  | 'merchandiser'
  | 'qc_inspector'

export type Position =
  | 'solo_founder'
  | 'md_ceo'
  | 'head_operations'
  | 'merchandiser'
  | 'designer'
  | 'accounts'

// Role selected during the separate Enterprise Brand onboarding
// (app/onboarding/enterprise), distinct from `Position` above which
// drives the Brand/Buyer adaptive dashboard.
export type EnterprisePosition =
  | 'md_ceo'
  | 'head_operations'
  | 'head_merchandising'
  | 'buying_head'
  | 'cfo'
  | 'it_head'
  | 'other'

export interface User {
  name: string
  // DERIVED marketplace persona — an enterprise account resolves to
  // 'buyer'. Never write this back to users.user_type; use `accountType`.
  // See app/lib/accountType.ts.
  userType: UserType
  // DB truth (users.user_type): a marketplace type or 'enterprise'.
  accountType: AccountType
  // True only when the DATABASE says 'enterprise'. Enterprise capability is
  // additive on top of full marketplace access.
  isEnterprise: boolean
  verificationTier: 'unverified' | 'bronze' | 'silver' | 'gold' | 'platinum'
  fabscore: number
  city: string
  email?: string
  profilePhoto?: string
  state?: string
  referralCode?: string
  position?: Position
  enterprisePosition?: EnterprisePosition
}

// The shape of a users row as returned by /api/dev-auth/lookup.
export interface DbUserRow {
  phone?: string | null
  name?: string | null
  email?: string | null
  city?: string | null
  state?: string | null
  user_type?: string | null
  position?: string | null
  profile_photo?: string | null
  verification_tier?: string | null
  profile_data?: { companyName?: string; role?: string } | null
}

interface UserContextType {
  user: User
  setUser: (user: Partial<User>) => void
  /**
   * Loads a signed-in identity from the DATABASE row and makes it live
   * immediately. Call this on login/signup right after the user lookup,
   * before navigating.
   *
   * REPLACES rather than merges: any field the new row doesn't specify
   * resets to its default instead of inheriting the previous account's
   * value. That is deliberate — merging would let a prior session's name,
   * city, tier or enterprise position bleed into a different account on a
   * shared browser.
   */
  applyIdentity: (dbUser: DbUserRow | null) => void
  isSupplySide: boolean
  isBuyer: boolean
  isTalent: boolean
  userLabel: string
  greeting: string
  mounted: boolean
}

const defaultUser: User = {
  name: 'Siddharth',
  userType: 'buyer',
  accountType: 'buyer',
  isEnterprise: false,
  verificationTier: 'bronze',
  fabscore: 0,
  city: ''
}

// Shown instead of the marketplace persona's label ("Brand Builder") for
// enterprise accounts, which act as buyers on the marketplace but are not
// Brand Builders.
const ENTERPRISE_LABEL = 'Enterprise'

// Per-account localStorage MIRRORS, cleared whenever a new identity is
// loaded so nothing from a previous session survives into a different
// account on the same browser.
//
// `fabverify_auth` is deliberately NOT in this list: login writes it before
// the user lookup runs, and the dev-mode authFetch path (app/lib/apiClient.ts)
// reads it to build the x-dev-phone header. Clearing it here would break
// dev-mode API auth. Do not add it.
const IDENTITY_MIRROR_KEYS = [
  'fabverify_user',
  'fabverify_user_type',
  'userType',
  'fabverify_profile',
  'fabverify_position',
  'fabverify_enterprise',
  'fabverify_enterprise_position',
]

// Builds a complete User from a database row — the one definition of how a
// users row becomes an in-memory identity. Everything not present on the
// row falls back to defaultUser, never to the currently-loaded user.
function userFromDbRow(dbUser: DbUserRow | null): User {
  if (!dbUser) return { ...defaultUser, name: '' }

  const resolved = resolveAccount(dbUser.user_type)

  // users.position holds the role INSIDE an enterprise for enterprise
  // accounts; for everyone else it is the Brand/Buyer adaptive position.
  // The two unions overlap on md_ceo/head_operations, so which field it
  // lands in is decided by the account type, never by the value itself.
  const position = dbUser.position ?? undefined

  return {
    ...defaultUser,
    ...resolved,
    name: dbUser.name ?? '',
    email: dbUser.email ?? undefined,
    city: dbUser.city ?? '',
    state: dbUser.state ?? undefined,
    profilePhoto: dbUser.profile_photo ?? undefined,
    verificationTier:
      (dbUser.verification_tier as User['verificationTier']) ?? defaultUser.verificationTier,
    position: resolved.isEnterprise ? undefined : (position as Position | undefined),
    enterprisePosition: resolved.isEnterprise
      ? (position as EnterprisePosition | undefined)
      : undefined,
  }
}

const USER_LABELS: Record<UserType, string> = {
  buyer: 'Brand Builder',
  manufacturer: 'Manufacturer',
  fabric_mill: 'Fabric Mill',
  trim_supplier: 'Trim Supplier',
  artisan: 'Artisan',
  job_worker: 'Job Worker',
  designer: 'Freelance Designer',
  master: 'Master',
  merchandiser: 'Merchandiser',
  qc_inspector: 'QC Inspector'
}

const LEGACY_TYPE_LABELS: Record<string, UserType> = {
  'Brand / Buyer': 'buyer',
  'Manufacturer': 'manufacturer',
  'Fabric Mill': 'fabric_mill',
  'Trim Supplier': 'trim_supplier',
  'Artisan': 'artisan',
  'Job Worker': 'job_worker',
  'Freelance Designer': 'designer',
  'Master': 'master',
  'Merchandiser': 'merchandiser',
  'QC Inspector': 'qc_inspector'
}

const SUPPLY_SIDE_TYPES: UserType[] = [
  'manufacturer', 'fabric_mill', 'trim_supplier', 'artisan', 'job_worker'
]

const TALENT_TYPES: UserType[] = [
  'designer', 'master', 'merchandiser', 'qc_inspector'
]

const UserContext = createContext<UserContextType>({
  user: defaultUser,
  setUser: () => {},
  applyIdentity: () => {},
  isSupplySide: false,
  isBuyer: true,
  isTalent: false,
  userLabel: USER_LABELS[defaultUser.userType],
  greeting: 'Good morning',
  mounted: false
})

export function UserProvider({ children }: {
  children: React.ReactNode
}) {
  const [user, setUserState] = useState<User>(defaultUser)
  const [greeting, setGreeting] = useState('Good morning')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const h = new Date().getHours()
    if (h >= 5 && h < 12) setGreeting('Good morning')
    else if (h >= 12 && h < 17) setGreeting('Good afternoon')
    else if (h >= 17 && h < 21) setGreeting('Good evening')
    else setGreeting('Good night')
  }, [])

  // Hydrates from localStorage, which is a MIRROR of the database written at
  // login — never the source of truth for identity. Whatever raw value is
  // found is passed through resolveAccount(), so an 'enterprise' account
  // always comes back as { accountType: 'enterprise', userType: 'buyer',
  // isEnterprise: true } and can never be mistaken for a Brand Builder.
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem('fabverify_user')
      const parsed = stored ? JSON.parse(stored) : null

      // Prefer the login-written mirror of users.user_type; fall back to the
      // account type on the stored user object, then the legacy key.
      const legacy = localStorage.getItem('userType')
      const rawAccountType =
        localStorage.getItem('fabverify_user_type') ??
        parsed?.accountType ??
        (legacy ? LEGACY_TYPE_LABELS[legacy] || legacy : null)

      const resolved = resolveAccount(rawAccountType)

      if (parsed) {
        setUserState({ ...defaultUser, ...parsed, ...resolved })
      } else {
        setUserState((prev) => ({ ...prev, ...resolved }))
      }
    } catch {}
  }, [])

  const setUser = (updates: Partial<User>) => {
    const updated = { ...user, ...updates }
    setUserState(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('fabverify_user', JSON.stringify(updated))
    }
  }

  // See the interface docs above. Updating React state here — rather than
  // only writing localStorage — is what makes a fresh login take effect
  // immediately: the provider mounts once in the root layout, so its
  // hydration effect never re-runs on a client-side navigation, and a login
  // that only wrote localStorage left the previous identity live until a
  // hard refresh.
  const applyIdentity = (dbUser: DbUserRow | null) => {
    const fresh = userFromDbRow(dbUser)
    setUserState(fresh)

    if (typeof window === 'undefined') return
    try {
      for (const key of IDENTITY_MIRROR_KEYS) localStorage.removeItem(key)

      localStorage.setItem('fabverify_user', JSON.stringify(fresh))

      // Only mirror a type once the account actually has one — a user who
      // hasn't finished onboarding must not look like a buyer.
      if (dbUser?.user_type) {
        localStorage.setItem('fabverify_user_type', dbUser.user_type)
      }

      if (dbUser) {
        localStorage.setItem(
          'fabverify_profile',
          JSON.stringify({
            name: dbUser.name,
            email: dbUser.email,
            city: dbUser.city,
            state: dbUser.state,
          })
        )
      }

      // Enterprise display mirrors, rebuilt from the database so the
      // workspace survives logout.
      if (fresh.isEnterprise) {
        if (dbUser?.position) {
          localStorage.setItem('fabverify_enterprise_position', dbUser.position)
        }
        const companyName = dbUser?.profile_data?.companyName
        if (companyName) {
          localStorage.setItem(
            'fabverify_enterprise',
            JSON.stringify({ companyName, role: dbUser?.profile_data?.role ?? null })
          )
        }
      }
    } catch {}
  }

  const isSupplySide = SUPPLY_SIDE_TYPES.includes(user.userType)
  const isBuyer = user.userType === 'buyer'
  const isTalent = TALENT_TYPES.includes(user.userType)

  return (
    <UserContext.Provider value={{
      user,
      setUser,
      applyIdentity,
      isSupplySide,
      isBuyer,
      isTalent,
      userLabel: user.isEnterprise
        ? ENTERPRISE_LABEL
        : USER_LABELS[user.userType] || 'Member',
      greeting,
      mounted
    }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
