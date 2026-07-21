'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import DiscoveryPage from '@/app/components/pages/DiscoveryPage'

export default function JobworkerClientsRoute() {
  const authorized = useTypeGuard('job_worker')
  if (!authorized) return null
  return <DiscoveryPage />
}
