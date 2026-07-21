'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import OrdersPage from '@/app/components/pages/OrdersPage'

export default function JobworkerOrdersRoute() {
  const authorized = useTypeGuard('job_worker')
  if (!authorized) return null
  return <OrdersPage />
}
