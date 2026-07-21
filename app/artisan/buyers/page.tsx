'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import DiscoveryPage from '@/app/components/pages/DiscoveryPage'

export default function ArtisanBuyersRoute() {
  const authorized = useTypeGuard('artisan')
  if (!authorized) return null
  return <DiscoveryPage />
}
