'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import CreditPage from '@/app/components/pages/CreditPage'

export default function ArtisanCreditRoute() {
  const authorized = useTypeGuard('artisan')
  if (!authorized) return null
  return <CreditPage />
}
