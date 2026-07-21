'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import CreditPage from '@/app/components/pages/CreditPage'

export default function MillCreditRoute() {
  const authorized = useTypeGuard('fabric_mill')
  if (!authorized) return null
  return <CreditPage />
}
