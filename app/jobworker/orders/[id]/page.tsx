'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import OrderDetailPage from '@/app/components/pages/OrderDetailPage'

export default function JobworkerOrdersIdRoute() {
  const authorized = useTypeGuard('job_worker')
  if (!authorized) return null
  return <OrderDetailPage />
}
