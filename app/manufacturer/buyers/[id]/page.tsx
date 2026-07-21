'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import ProfilePage from '@/app/components/pages/ProfilePage'

export default function ManufacturerBuyersIdRoute() {
  const authorized = useTypeGuard('manufacturer')
  if (!authorized) return null
  return <ProfilePage />
}
