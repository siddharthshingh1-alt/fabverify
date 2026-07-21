'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import ProfileSettingsPage from '@/app/components/pages/ProfileSettingsPage'

export default function MillProfileRoute() {
  const authorized = useTypeGuard('fabric_mill')
  if (!authorized) return null
  return <ProfileSettingsPage />
}
