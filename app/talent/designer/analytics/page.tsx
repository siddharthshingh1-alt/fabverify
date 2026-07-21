'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import AnalyticsPage from '@/app/components/pages/AnalyticsPage'

export default function TalentDesignerAnalyticsRoute() {
  const authorized = useTypeGuard('designer')
  if (!authorized) return null
  return <AnalyticsPage />
}
