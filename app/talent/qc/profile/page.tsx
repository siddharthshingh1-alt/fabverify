'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import ProfileSettingsPage from '@/app/components/pages/ProfileSettingsPage'

export default function TalentQcProfileRoute() {
  const authorized = useTypeGuard('qc_inspector')
  if (!authorized) return null
  return <ProfileSettingsPage />
}
