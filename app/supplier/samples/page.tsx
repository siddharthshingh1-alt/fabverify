'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import SamplesPage from '@/app/components/pages/SamplesPage'

export default function SupplierSamplesRoute() {
  const authorized = useTypeGuard('trim_supplier')
  if (!authorized) return null
  return <SamplesPage />
}
