'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import EnquiriesPage from '@/app/components/pages/EnquiriesPage'

export default function MillEnquiriesRoute() {
  const authorized = useTypeGuard('fabric_mill')
  if (!authorized) return null
  return <EnquiriesPage />
}
