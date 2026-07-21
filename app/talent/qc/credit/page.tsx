'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import CreditPage from '@/app/components/pages/CreditPage'

export default function TalentQcCreditRoute() {
  const authorized = useTypeGuard('qc_inspector')
  if (!authorized) return null
  return <CreditPage />
}
