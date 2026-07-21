'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import DiscoveryPage from '@/app/components/pages/DiscoveryPage'

export default function SupplierBuyersRoute() {
  const authorized = useTypeGuard('trim_supplier')
  if (!authorized) return null
  return <DiscoveryPage />
}
