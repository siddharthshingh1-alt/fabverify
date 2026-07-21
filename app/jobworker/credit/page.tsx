'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import CreditPage from '@/app/components/pages/CreditPage'

export default function JobworkerCreditRoute() {
  const authorized = useTypeGuard('job_worker')
  if (!authorized) return null
  return <CreditPage />
}
