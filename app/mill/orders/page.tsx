'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import OrdersPage from '@/app/components/pages/OrdersPage'

export default function MillOrdersRoute() {
  const authorized = useTypeGuard('fabric_mill')
  if (!authorized) return null
  return <OrdersPage />
}
