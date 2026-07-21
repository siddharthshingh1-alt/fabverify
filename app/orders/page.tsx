'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '../context/UserContext'
import { getBasePath, getOrdersSlug } from '../lib/routing'
import LoadingWorkspace from '../components/LoadingWorkspace'

export default function OrdersRedirect() {
  const router = useRouter()
  const { user, mounted } = useUser()

  useEffect(() => {
    if (!mounted) return
    router.replace(`${getBasePath(user.userType)}/${getOrdersSlug(user.userType)}`)
  }, [mounted, user, router])

  return <LoadingWorkspace />
}
