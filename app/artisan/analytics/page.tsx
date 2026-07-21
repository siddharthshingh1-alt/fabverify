'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import AnalyticsPage from '@/app/components/pages/AnalyticsPage'

export default function ArtisanAnalyticsRoute() {
  const authorized = useTypeGuard('artisan')
  if (!authorized) return null
  return <AnalyticsPage />
}
