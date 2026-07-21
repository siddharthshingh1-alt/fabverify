'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import CreditPage from '@/app/components/pages/CreditPage'

export default function TalentDesignerCreditRoute() {
  const authorized = useTypeGuard('designer')
  if (!authorized) return null
  return <CreditPage />
}
