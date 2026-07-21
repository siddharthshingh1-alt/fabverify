'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import ProfileSettingsPage from '@/app/components/pages/ProfileSettingsPage'

export default function ManufacturerProfileRoute() {
  const authorized = useTypeGuard('manufacturer')
  if (!authorized) return null
  return <ProfileSettingsPage />
}
