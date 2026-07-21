'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '../context/UserContext'
import type { UserType } from '../context/UserContext'
import { getBasePath } from '../lib/routing'
import LoadingWorkspace from '../components/LoadingWorkspace'

const HAS_SAMPLES: UserType[] = ['buyer', 'manufacturer', 'fabric_mill', 'trim_supplier']

export default function SamplesRedirect() {
  const router = useRouter()
  const { user, mounted } = useUser()

  useEffect(() => {
    if (!mounted) return
    const basePath = getBasePath(user.userType)
    router.replace(HAS_SAMPLES.includes(user.userType) ? `${basePath}/samples` : `${basePath}/dashboard`)
  }, [mounted, user, router])

  return <LoadingWorkspace />
}
