'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import AnalyticsPage from '@/app/components/pages/AnalyticsPage'

export default function JobworkerAnalyticsRoute() {
  const authorized = useTypeGuard('job_worker')
  if (!authorized) return null
  return <AnalyticsPage />
}
