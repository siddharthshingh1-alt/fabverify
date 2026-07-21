'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import EnquiriesPage from '@/app/components/pages/EnquiriesPage'

export default function TalentMerchandiserEnquiriesRoute() {
  const authorized = useTypeGuard('merchandiser')
  if (!authorized) return null
  return <EnquiriesPage />
}
