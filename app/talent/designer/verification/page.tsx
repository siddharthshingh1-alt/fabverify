'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import VerificationPage from '@/app/components/pages/VerificationPage'

export default function TalentDesignerVerificationRoute() {
  const authorized = useTypeGuard('designer')
  if (!authorized) return null
  return <VerificationPage />
}
