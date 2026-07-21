'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import ProfilePage from '@/app/components/pages/ProfilePage'

export default function TalentMerchandiserClientsIdRoute() {
  const authorized = useTypeGuard('merchandiser')
  if (!authorized) return null
  return <ProfilePage />
}
