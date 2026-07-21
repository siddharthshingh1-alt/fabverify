'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import ProfileSettingsPage from '@/app/components/pages/ProfileSettingsPage'

export default function ArtisanProfileRoute() {
  const authorized = useTypeGuard('artisan')
  if (!authorized) return null
  return <ProfileSettingsPage />
}
