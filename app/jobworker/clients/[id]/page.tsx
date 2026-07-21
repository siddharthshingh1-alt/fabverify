'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import ProfilePage from '@/app/components/pages/ProfilePage'

export default function JobworkerClientsIdRoute() {
  const authorized = useTypeGuard('job_worker')
  if (!authorized) return null
  return <ProfilePage />
}
