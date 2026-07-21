'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import DiscoveryPage from '@/app/components/pages/DiscoveryPage'

export default function MillBuyersRoute() {
  const authorized = useTypeGuard('fabric_mill')
  if (!authorized) return null
  return <DiscoveryPage />
}
