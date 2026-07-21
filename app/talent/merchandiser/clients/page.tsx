'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import DiscoveryPage from '@/app/components/pages/DiscoveryPage'

export default function TalentMerchandiserClientsRoute() {
  const authorized = useTypeGuard('merchandiser')
  if (!authorized) return null
  return <DiscoveryPage />
}
