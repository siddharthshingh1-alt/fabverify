'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import CreditPage from '@/app/components/pages/CreditPage'

export default function BrandCreditRoute() {
  const authorized = useTypeGuard('buyer')
  if (!authorized) return null
  return <CreditPage />
}
