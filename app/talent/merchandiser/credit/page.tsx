'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import CreditPage from '@/app/components/pages/CreditPage'

export default function TalentMerchandiserCreditRoute() {
  const authorized = useTypeGuard('merchandiser')
  if (!authorized) return null
  return <CreditPage />
}
