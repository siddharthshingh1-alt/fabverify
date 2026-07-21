'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import OrdersPage from '@/app/components/pages/OrdersPage'

export default function SupplierOrdersRoute() {
  const authorized = useTypeGuard('trim_supplier')
  if (!authorized) return null
  return <OrdersPage />
}
