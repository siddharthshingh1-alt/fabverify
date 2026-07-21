'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import VerificationPage from '@/app/components/pages/VerificationPage'

export default function TalentMerchandiserVerificationRoute() {
  const authorized = useTypeGuard('merchandiser')
  if (!authorized) return null
  return <VerificationPage />
}
