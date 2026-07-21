'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import VerificationPage from '@/app/components/pages/VerificationPage'

export default function JobworkerVerificationRoute() {
  const authorized = useTypeGuard('job_worker')
  if (!authorized) return null
  return <VerificationPage />
}
