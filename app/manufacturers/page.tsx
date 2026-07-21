'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '../context/UserContext'
import { getBasePath, getDiscoverySlug } from '../lib/routing'
import LoadingWorkspace from '../components/LoadingWorkspace'

export default function DiscoveryRedirect() {
  const router = useRouter()
  const { user, mounted } = useUser()

  useEffect(() => {
    if (!mounted) return
    router.replace(`${getBasePath(user.userType)}/${getDiscoverySlug(user.userType)}`)
  }, [mounted, user, router])

  return <LoadingWorkspace />
}
