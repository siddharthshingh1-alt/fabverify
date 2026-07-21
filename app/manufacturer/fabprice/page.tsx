'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import FabPricePage from '@/app/components/pages/FabPricePage'

export default function ManufacturerFabpriceRoute() {
  const authorized = useTypeGuard('manufacturer')
  if (!authorized) return null
  return <FabPricePage />
}
