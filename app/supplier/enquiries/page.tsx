'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import EnquiriesPage from '@/app/components/pages/EnquiriesPage'

export default function SupplierEnquiriesRoute() {
  const authorized = useTypeGuard('trim_supplier')
  if (!authorized) return null
  return <EnquiriesPage />
}
