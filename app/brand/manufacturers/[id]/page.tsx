'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import ProfilePage from '@/app/components/pages/ProfilePage'

export default function BrandManufacturersIdRoute() {
  const authorized = useTypeGuard('buyer')
  if (!authorized) return null
  return <ProfilePage />
}
