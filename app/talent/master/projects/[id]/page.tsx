'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import OrderDetailPage from '@/app/components/pages/OrderDetailPage'

export default function TalentMasterProjectsIdRoute() {
  const authorized = useTypeGuard('master')
  if (!authorized) return null
  return <OrderDetailPage />
}
