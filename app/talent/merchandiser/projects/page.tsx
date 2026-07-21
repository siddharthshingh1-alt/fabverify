'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import OrdersPage from '@/app/components/pages/OrdersPage'

export default function TalentMerchandiserProjectsRoute() {
  const authorized = useTypeGuard('merchandiser')
  if (!authorized) return null
  return <OrdersPage />
}
