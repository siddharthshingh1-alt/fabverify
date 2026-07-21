'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import FabPricePage from '@/app/components/pages/FabPricePage'

export default function TalentMasterFabpriceRoute() {
  const authorized = useTypeGuard('master')
  if (!authorized) return null
  return <FabPricePage />
}
