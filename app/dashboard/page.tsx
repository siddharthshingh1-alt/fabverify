'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '../context/UserContext'
import { getLandingRoute } from '../lib/routing'
import { consumePendingChatRedirect } from '../lib/postAuthRedirect'
import LoadingWorkspace from '../components/LoadingWorkspace'

export default function DashboardRedirect() {
  const router = useRouter()
  const { user, mounted } = useUser()

  // Enterprise accounts land in the enterprise workspace by default. They
  // keep full marketplace access via the 'buyer' persona — the marketplace
  // routes stay reachable, this only decides where "home" is.
  useEffect(() => {
    if (!mounted) return
    const chatRedirect = consumePendingChatRedirect()
    router.replace(chatRedirect ?? getLandingRoute(user.accountType))
  }, [mounted, user, router])

  return <LoadingWorkspace />
}
