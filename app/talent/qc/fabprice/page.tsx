'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import FabPricePage from '@/app/components/pages/FabPricePage'

export default function TalentQcFabpriceRoute() {
  const authorized = useTypeGuard('qc_inspector')
  if (!authorized) return null
  return <FabPricePage />
}
