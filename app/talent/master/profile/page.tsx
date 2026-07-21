'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import ProfileSettingsPage from '@/app/components/pages/ProfileSettingsPage'

export default function TalentMasterProfileRoute() {
  const authorized = useTypeGuard('master')
  if (!authorized) return null
  return <ProfileSettingsPage />
}
