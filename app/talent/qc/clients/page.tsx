'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import DiscoveryPage from '@/app/components/pages/DiscoveryPage'

export default function TalentQcClientsRoute() {
  const authorized = useTypeGuard('qc_inspector')
  if (!authorized) return null
  return <DiscoveryPage />
}
