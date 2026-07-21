'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import OrderDetailPage from '@/app/components/pages/OrderDetailPage'

export default function TalentMerchandiserProjectsIdRoute() {
  const authorized = useTypeGuard('merchandiser')
  if (!authorized) return null
  return <OrderDetailPage />
}
