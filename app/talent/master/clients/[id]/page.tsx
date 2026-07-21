'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import ProfilePage from '@/app/components/pages/ProfilePage'

export default function TalentMasterClientsIdRoute() {
  const authorized = useTypeGuard('master')
  if (!authorized) return null
  return <ProfilePage />
}
