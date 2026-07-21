'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import FabPricePage from '@/app/components/pages/FabPricePage'

export default function SupplierFabpriceRoute() {
  const authorized = useTypeGuard('trim_supplier')
  if (!authorized) return null
  return <FabPricePage />
}
