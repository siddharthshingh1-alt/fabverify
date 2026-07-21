'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import FabPricePage from '@/app/components/pages/FabPricePage'

export default function JobworkerFabpriceRoute() {
  const authorized = useTypeGuard('job_worker')
  if (!authorized) return null
  return <FabPricePage />
}
