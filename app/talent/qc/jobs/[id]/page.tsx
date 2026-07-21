'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import OrderDetailPage from '@/app/components/pages/OrderDetailPage'

export default function TalentQcJobsIdRoute() {
  const authorized = useTypeGuard('qc_inspector')
  if (!authorized) return null
  return <OrderDetailPage />
}
