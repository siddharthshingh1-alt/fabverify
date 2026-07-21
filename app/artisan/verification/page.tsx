'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import VerificationPage from '@/app/components/pages/VerificationPage'

export default function ArtisanVerificationRoute() {
  const authorized = useTypeGuard('artisan')
  if (!authorized) return null
  return <VerificationPage />
}
