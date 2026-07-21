'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import TalentProfilePage from '@/app/components/pages/TalentProfilePage'

// Same shared-marketplace reasoning as app/brand/fabmerch/page.tsx.
export default function BrandFabmerchIdRoute() {
  const authorized = useTypeGuard(['buyer', 'manufacturer', 'fabric_mill', 'trim_supplier', 'artisan', 'job_worker'])
  if (!authorized) return null
  return <TalentProfilePage />
}
