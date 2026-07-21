'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import AnalyticsPage from '@/app/components/pages/AnalyticsPage'

export default function SupplierAnalyticsRoute() {
  const authorized = useTypeGuard('trim_supplier')
  if (!authorized) return null
  return <AnalyticsPage />
}
