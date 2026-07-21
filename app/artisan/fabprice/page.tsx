'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import FabPricePage from '@/app/components/pages/FabPricePage'

export default function ArtisanFabpriceRoute() {
  const authorized = useTypeGuard('artisan')
  if (!authorized) return null
  return <FabPricePage />
}
