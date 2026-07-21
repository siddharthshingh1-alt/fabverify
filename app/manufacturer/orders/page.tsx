'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import OrdersPage from '@/app/components/pages/OrdersPage'

export default function ManufacturerOrdersRoute() {
  const authorized = useTypeGuard('manufacturer')
  if (!authorized) return null
  return <OrdersPage />
}
