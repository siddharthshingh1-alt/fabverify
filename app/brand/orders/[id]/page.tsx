'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import OrderDetailPage from '@/app/components/pages/OrderDetailPage'

export default function BrandOrdersIdRoute() {
  const authorized = useTypeGuard('buyer')
  if (!authorized) return null
  return <OrderDetailPage />
}
