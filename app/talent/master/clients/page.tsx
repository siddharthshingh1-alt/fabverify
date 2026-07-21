'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import DiscoveryPage from '@/app/components/pages/DiscoveryPage'

export default function TalentMasterClientsRoute() {
  const authorized = useTypeGuard('master')
  if (!authorized) return null
  return <DiscoveryPage />
}
