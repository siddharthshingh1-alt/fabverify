'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import VerificationPage from '@/app/components/pages/VerificationPage'

export default function BrandVerificationRoute() {
  const authorized = useTypeGuard('buyer')
  if (!authorized) return null
  return <VerificationPage />
}
