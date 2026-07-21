'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import CreditPage from '@/app/components/pages/CreditPage'

export default function SupplierCreditRoute() {
  const authorized = useTypeGuard('trim_supplier')
  if (!authorized) return null
  return <CreditPage />
}
