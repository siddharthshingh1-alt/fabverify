'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import SamplesPage from '@/app/components/pages/SamplesPage'

export default function ManufacturerSamplesRoute() {
  const authorized = useTypeGuard('manufacturer')
  if (!authorized) return null
  return <SamplesPage />
}
