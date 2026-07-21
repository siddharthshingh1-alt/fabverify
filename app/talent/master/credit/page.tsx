'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import CreditPage from '@/app/components/pages/CreditPage'

export default function TalentMasterCreditRoute() {
  const authorized = useTypeGuard('master')
  if (!authorized) return null
  return <CreditPage />
}
