'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import VerificationPage from '@/app/components/pages/VerificationPage'

export default function ManufacturerVerificationRoute() {
  const authorized = useTypeGuard('manufacturer')
  if (!authorized) return null
  return <VerificationPage />
}
