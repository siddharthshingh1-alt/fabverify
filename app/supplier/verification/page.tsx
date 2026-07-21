'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import VerificationPage from '@/app/components/pages/VerificationPage'

export default function SupplierVerificationRoute() {
  const authorized = useTypeGuard('trim_supplier')
  if (!authorized) return null
  return <VerificationPage />
}
