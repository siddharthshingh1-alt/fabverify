'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import ProfilePage from '@/app/components/pages/ProfilePage'

export default function SupplierBuyersIdRoute() {
  const authorized = useTypeGuard('trim_supplier')
  if (!authorized) return null
  return <ProfilePage />
}
