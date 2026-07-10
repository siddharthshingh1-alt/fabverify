'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'

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

export interface User {
  name: string
  userType: UserType
  verificationTier: 'unverified' | 'bronze' | 'silver' | 'gold' | 'platinum'
  fabscore: number
  city: string
}

interface UserContextType {
  user: User
  setUser: (user: Partial<User>) => void
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
  verificationTier: 'bronze',
  fabscore: 0,
  city: ''
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

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem('fabverify_user')
      if (stored) {
        const parsed = JSON.parse(stored)
        setUserState({ ...defaultUser, ...parsed })
      } else {
        const type = localStorage.getItem('userType')
        if (type) {
          const userType = (LEGACY_TYPE_LABELS[type] || type) as UserType
          setUserState((prev) => ({ ...prev, userType }))
        }
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

  const isSupplySide = SUPPLY_SIDE_TYPES.includes(user.userType)
  const isBuyer = user.userType === 'buyer'
  const isTalent = TALENT_TYPES.includes(user.userType)

  return (
    <UserContext.Provider value={{
      user,
      setUser,
      isSupplySide,
      isBuyer,
      isTalent,
      userLabel: USER_LABELS[user.userType] || 'Member',
      greeting,
      mounted
    }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
