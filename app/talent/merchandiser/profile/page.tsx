'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import ProfileSettingsPage from '@/app/components/pages/ProfileSettingsPage'

export default function TalentMerchandiserProfileRoute() {
  const authorized = useTypeGuard('merchandiser')
  if (!authorized) return null
  return <ProfileSettingsPage />
}
