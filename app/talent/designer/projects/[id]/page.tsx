'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import OrderDetailPage from '@/app/components/pages/OrderDetailPage'

export default function TalentDesignerProjectsIdRoute() {
  const authorized = useTypeGuard('designer')
  if (!authorized) return null
  return <OrderDetailPage />
}
