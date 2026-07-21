'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import CreditPage from '@/app/components/pages/CreditPage'

export default function ManufacturerCreditRoute() {
  const authorized = useTypeGuard('manufacturer')
  if (!authorized) return null
  return <CreditPage />
}
