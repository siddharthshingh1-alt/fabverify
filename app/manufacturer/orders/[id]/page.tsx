'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import OrderDetailPage from '@/app/components/pages/OrderDetailPage'

export default function ManufacturerOrdersIdRoute() {
  const authorized = useTypeGuard('manufacturer')
  if (!authorized) return null
  return <OrderDetailPage />
}
