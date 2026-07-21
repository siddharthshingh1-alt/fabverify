'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '../context/UserContext'
import { getBasePath } from '../lib/routing'
import LoadingWorkspace from '../components/LoadingWorkspace'

export default function CreditRedirect() {
  const router = useRouter()
  const { user, mounted } = useUser()

  useEffect(() => {
    if (!mounted) return
    router.replace(`${getBasePath(user.userType)}/credit`)
  }, [mounted, user, router])

  return <LoadingWorkspace />
}
