'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import EnquiriesPage from '@/app/components/pages/EnquiriesPage'

export default function ManufacturerEnquiriesRoute() {
  const authorized = useTypeGuard('manufacturer')
  if (!authorized) return null
  return <EnquiriesPage />
}
