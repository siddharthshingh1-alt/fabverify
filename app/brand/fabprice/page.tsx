'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import FabPricePage from '@/app/components/pages/FabPricePage'

export default function BrandFabpriceRoute() {
  const authorized = useTypeGuard('buyer')
  if (!authorized) return null
  return <FabPricePage />
}
