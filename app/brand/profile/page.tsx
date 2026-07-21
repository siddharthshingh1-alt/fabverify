'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import ProfileSettingsPage from '@/app/components/pages/ProfileSettingsPage'

export default function BrandProfileRoute() {
  const authorized = useTypeGuard('buyer')
  if (!authorized) return null
  return <ProfileSettingsPage />
}
