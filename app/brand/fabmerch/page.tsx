'use client'

import { useTypeGuard } from '@/app/hooks/useTypeGuard'
import FabMerchPage from '@/app/components/pages/FabMerchPage'

// Shared talent-booking marketplace: every non-talent type reaches this via
// their own nav ("Book QC Inspector" for manufacturer/mill/supplier/artisan/
// job_worker points here directly, since none of them have their own copy).
export default function BrandFabmerchRoute() {
  const authorized = useTypeGuard(['buyer', 'manufacturer', 'fabric_mill', 'trim_supplier', 'artisan', 'job_worker'])
  if (!authorized) return null
  return <FabMerchPage />
}
