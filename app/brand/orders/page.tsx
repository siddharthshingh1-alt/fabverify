'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import OrdersPage from '@/app/components/pages/OrdersPage'

export default function BrandOrdersRoute() {
  const authorized = useTypeGuard('buyer')
  if (!authorized) return null
  return <OrdersPage />
}
