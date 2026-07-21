'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import FabPricePage from '@/app/components/pages/FabPricePage'

export default function TalentDesignerFabpriceRoute() {
  const authorized = useTypeGuard('designer')
  if (!authorized) return null
  return <FabPricePage />
}
