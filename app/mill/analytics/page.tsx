'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import AnalyticsPage from '@/app/components/pages/AnalyticsPage'

export default function MillAnalyticsRoute() {
  const authorized = useTypeGuard('fabric_mill')
  if (!authorized) return null
  return <AnalyticsPage />
}
