'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import OrderDetailPage from '@/app/components/pages/OrderDetailPage'

export default function ArtisanOrdersIdRoute() {
  const authorized = useTypeGuard('artisan')
  if (!authorized) return null
  return <OrderDetailPage />
}
