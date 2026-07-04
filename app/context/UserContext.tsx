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
  setUser: (user: User) => void
  isSupplySide: boolean
  isBuyer: boolean
  isTalent: boolean
  userLabel: string
  greeting: string
}

const defaultUser: User = {
  name: 'Siddharth',
  userType: 'buyer',
  verificationTier: 'bronze',
  fabscore: 0,
  city: 'Delhi NCR'
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

const SUPPLY_SIDE_TYPES: UserType[] = [
  'manufacturer', 'fabric_mill', 'trim_supplier', 'artisan', 'job_worker'
]

const TALENT_TYPES: UserType[] = [
  'designer', 'master', 'merchandiser', 'qc_inspector'
]

function getGreeting() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 21) return 'Good evening'
  return 'Good night'
}

const UserContext = createContext<UserContextType>({
  user: defaultUser,
  setUser: () => {},
  isSupplySide: false,
  isBuyer: true,
  isTalent: false,
  userLabel: USER_LABELS[defaultUser.userType],
  greeting: 'Good morning'
})

export function UserProvider({ children }: {
  children: React.ReactNode
}) {
  const [user, setUserState] = useState<User>(defaultUser)

  useEffect(() => {
    const stored = localStorage.getItem('fabverify_user')
    if (stored) {
      setUserState(JSON.parse(stored))
    }
  }, [])

  const setUser = (newUser: User) => {
    setUserState(newUser)
    localStorage.setItem('fabverify_user', JSON.stringify(newUser))
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
      userLabel: USER_LABELS[user.userType],
      greeting: getGreeting()
    }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
