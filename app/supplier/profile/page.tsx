'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import ProfileSettingsPage from '@/app/components/pages/ProfileSettingsPage'

export default function SupplierProfileRoute() {
  const authorized = useTypeGuard('trim_supplier')
  if (!authorized) return null
  return <ProfileSettingsPage />
}
