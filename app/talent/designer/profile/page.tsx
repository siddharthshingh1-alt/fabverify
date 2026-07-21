'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import ProfileSettingsPage from '@/app/components/pages/ProfileSettingsPage'

export default function TalentDesignerProfileRoute() {
  const authorized = useTypeGuard('designer')
  if (!authorized) return null
  return <ProfileSettingsPage />
}
