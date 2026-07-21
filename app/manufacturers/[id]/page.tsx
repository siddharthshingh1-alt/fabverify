'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '../../context/UserContext'
import { getBasePath, getDiscoverySlug } from '../../lib/routing'
import LoadingWorkspace from '../../components/LoadingWorkspace'

export default function ProfileDetailRedirect() {
  const router = useRouter()
  const { user, mounted } = useUser()
  const params = useParams<{ id: string }>()

  useEffect(() => {
    if (!mounted) return
    router.replace(`${getBasePath(user.userType)}/${getDiscoverySlug(user.userType)}/${params.id}`)
  }, [mounted, user, params.id, router])

  return <LoadingWorkspace />
}
