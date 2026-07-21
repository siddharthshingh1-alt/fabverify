'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import DiscoveryPage from '@/app/components/pages/DiscoveryPage'

export default function TalentDesignerClientsRoute() {
  const authorized = useTypeGuard('designer')
  if (!authorized) return null
  return <DiscoveryPage />
}
