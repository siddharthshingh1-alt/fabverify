'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '../context/UserContext'
import type { UserType } from '../context/UserContext'
import { getBasePath } from '../lib/routing'
import LoadingWorkspace from '../components/LoadingWorkspace'

const NO_ANALYTICS: UserType[] = ['master', 'merchandiser', 'qc_inspector']

export default function AnalyticsRedirect() {
  const router = useRouter()
  const { user, mounted } = useUser()

  useEffect(() => {
    if (!mounted) return
    const basePath = getBasePath(user.userType)
    router.replace(NO_ANALYTICS.includes(user.userType) ? `${basePath}/dashboard` : `${basePath}/analytics`)
  }, [mounted, user, router])

  return <LoadingWorkspace />
}
