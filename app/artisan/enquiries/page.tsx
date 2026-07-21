'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import EnquiriesPage from '@/app/components/pages/EnquiriesPage'

export default function ArtisanEnquiriesRoute() {
  const authorized = useTypeGuard('artisan')
  if (!authorized) return null
  return <EnquiriesPage />
}
