'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import OrderDetailPage from '@/app/components/pages/OrderDetailPage'

export default function SupplierOrdersIdRoute() {
  const authorized = useTypeGuard('trim_supplier')
  if (!authorized) return null
  return <OrderDetailPage />
}
