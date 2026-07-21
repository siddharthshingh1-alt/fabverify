'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import OrdersPage from '@/app/components/pages/OrdersPage'

export default function TalentQcJobsRoute() {
  const authorized = useTypeGuard('qc_inspector')
  if (!authorized) return null
  return <OrdersPage />
}
