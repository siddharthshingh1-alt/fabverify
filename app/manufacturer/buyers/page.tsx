'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import DiscoveryPage from '@/app/components/pages/DiscoveryPage'

export default function ManufacturerBuyersRoute() {
  const authorized = useTypeGuard('manufacturer')
  if (!authorized) return null
  return <DiscoveryPage />
}
