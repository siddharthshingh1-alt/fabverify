'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import ProfilePage from '@/app/components/pages/ProfilePage'

export default function ArtisanBuyersIdRoute() {
  const authorized = useTypeGuard('artisan')
  if (!authorized) return null
  return <ProfilePage />
}
