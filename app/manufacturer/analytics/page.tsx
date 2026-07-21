'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import AnalyticsPage from '@/app/components/pages/AnalyticsPage'

export default function ManufacturerAnalyticsRoute() {
  const authorized = useTypeGuard('manufacturer')
  if (!authorized) return null
  return <AnalyticsPage />
}
