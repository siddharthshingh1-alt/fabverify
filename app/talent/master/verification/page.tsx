'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import VerificationPage from '@/app/components/pages/VerificationPage'

export default function TalentMasterVerificationRoute() {
  const authorized = useTypeGuard('master')
  if (!authorized) return null
  return <VerificationPage />
}
