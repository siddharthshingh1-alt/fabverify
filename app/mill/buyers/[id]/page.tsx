'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import ProfilePage from '@/app/components/pages/ProfilePage'

export default function MillBuyersIdRoute() {
  const authorized = useTypeGuard('fabric_mill')
  if (!authorized) return null
  return <ProfilePage />
}
