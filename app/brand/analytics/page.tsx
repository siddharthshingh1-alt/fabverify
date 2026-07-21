'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import AnalyticsPage from '@/app/components/pages/AnalyticsPage'

export default function BrandAnalyticsRoute() {
  const authorized = useTypeGuard('buyer')
  if (!authorized) return null
  return <AnalyticsPage />
}
