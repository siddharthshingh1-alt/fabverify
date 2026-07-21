'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import EnquiriesPage from '@/app/components/pages/EnquiriesPage'

export default function BrandEnquiriesRoute() {
  const authorized = useTypeGuard('buyer')
  if (!authorized) return null
  return <EnquiriesPage />
}
