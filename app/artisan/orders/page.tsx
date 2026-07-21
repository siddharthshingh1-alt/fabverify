'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import OrdersPage from '@/app/components/pages/OrdersPage'

export default function ArtisanOrdersRoute() {
  const authorized = useTypeGuard('artisan')
  if (!authorized) return null
  return <OrdersPage />
}
