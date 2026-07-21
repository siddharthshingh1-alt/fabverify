'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import FabPricePage from '@/app/components/pages/FabPricePage'

export default function MillFabpriceRoute() {
  const authorized = useTypeGuard('fabric_mill')
  if (!authorized) return null
  return <FabPricePage />
}
