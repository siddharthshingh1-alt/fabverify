'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import EnquiriesPage from '@/app/components/pages/EnquiriesPage'

export default function TalentMasterEnquiriesRoute() {
  const authorized = useTypeGuard('master')
  if (!authorized) return null
  return <EnquiriesPage />
}
