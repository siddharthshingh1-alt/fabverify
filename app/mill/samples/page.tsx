'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import SamplesPage from '@/app/components/pages/SamplesPage'

export default function MillSamplesRoute() {
  const authorized = useTypeGuard('fabric_mill')
  if (!authorized) return null
  return <SamplesPage />
}
