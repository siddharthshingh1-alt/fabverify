'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import SamplesPage from '@/app/components/pages/SamplesPage'

export default function BrandSamplesRoute() {
  const authorized = useTypeGuard('buyer')
  if (!authorized) return null
  return <SamplesPage />
}
