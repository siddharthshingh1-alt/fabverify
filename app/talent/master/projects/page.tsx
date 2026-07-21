'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import OrdersPage from '@/app/components/pages/OrdersPage'

export default function TalentMasterProjectsRoute() {
  const authorized = useTypeGuard('master')
  if (!authorized) return null
  return <OrdersPage />
}
