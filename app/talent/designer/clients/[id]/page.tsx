'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import ProfilePage from '@/app/components/pages/ProfilePage'

export default function TalentDesignerClientsIdRoute() {
  const authorized = useTypeGuard('designer')
  if (!authorized) return null
  return <ProfilePage />
}
