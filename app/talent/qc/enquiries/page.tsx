'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import EnquiriesPage from '@/app/components/pages/EnquiriesPage'

export default function TalentQcEnquiriesRoute() {
  const authorized = useTypeGuard('qc_inspector')
  if (!authorized) return null
  return <EnquiriesPage />
}
