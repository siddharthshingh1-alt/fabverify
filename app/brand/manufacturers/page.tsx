'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import DiscoveryPage from '@/app/components/pages/DiscoveryPage'

export default function BrandManufacturersRoute() {
  const authorized = useTypeGuard('buyer')
  if (!authorized) return null
  return <DiscoveryPage />
}
