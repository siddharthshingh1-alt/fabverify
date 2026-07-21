'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import OrdersPage from '@/app/components/pages/OrdersPage'

export default function TalentDesignerProjectsRoute() {
  const authorized = useTypeGuard('designer')
  if (!authorized) return null
  return <OrdersPage />
}
