'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import ProfilePage from '@/app/components/pages/ProfilePage'

export default function TalentQcClientsIdRoute() {
  const authorized = useTypeGuard('qc_inspector')
  if (!authorized) return null
  return <ProfilePage />
}
