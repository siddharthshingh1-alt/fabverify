'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import VerificationPage from '@/app/components/pages/VerificationPage'

export default function MillVerificationRoute() {
  const authorized = useTypeGuard('fabric_mill')
  if (!authorized) return null
  return <VerificationPage />
}
