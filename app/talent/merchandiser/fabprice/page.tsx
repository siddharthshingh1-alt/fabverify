'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import FabPricePage from '@/app/components/pages/FabPricePage'

export default function TalentMerchandiserFabpriceRoute() {
  const authorized = useTypeGuard('merchandiser')
  if (!authorized) return null
  return <FabPricePage />
}
