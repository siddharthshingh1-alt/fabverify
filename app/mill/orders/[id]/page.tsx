'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import OrderDetailPage from '@/app/components/pages/OrderDetailPage'

export default function MillOrdersIdRoute() {
  const authorized = useTypeGuard('fabric_mill')
  if (!authorized) return null
  return <OrderDetailPage />
}
