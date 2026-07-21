'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import VerificationPage from '@/app/components/pages/VerificationPage'

export default function TalentQcVerificationRoute() {
  const authorized = useTypeGuard('qc_inspector')
  if (!authorized) return null
  return <VerificationPage />
}
