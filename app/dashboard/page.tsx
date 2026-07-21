'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '../context/UserContext'
import { getBasePath } from '../lib/routing'
import { consumePendingChatRedirect } from '../lib/postAuthRedirect'
import LoadingWorkspace from '../components/LoadingWorkspace'

export default function DashboardRedirect() {
  const router = useRouter()
  const { user, mounted } = useUser()

  useEffect(() => {
    if (!mounted) return
    const chatRedirect = consumePendingChatRedirect()
    router.replace(chatRedirect ?? `${getBasePath(user.userType)}/dashboard`)
  }, [mounted, user, router])

  return <LoadingWorkspace />
}
