'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import EnquiriesPage from '@/app/components/pages/EnquiriesPage'

export default function TalentDesignerEnquiriesRoute() {
  const authorized = useTypeGuard('designer')
  if (!authorized) return null
  return <EnquiriesPage />
}
