'use client'

import { Suspense, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '../../context/UserContext'
import { getBasePath, getOrdersSlug } from '../../lib/routing'
import LoadingWorkspace from '../../components/LoadingWorkspace'

function OrderDetailRedirectInner() {
  const router = useRouter()
  const { user, mounted } = useUser()
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!mounted) return
    const qs = searchParams.toString()
    const target = `${getBasePath(user.userType)}/${getOrdersSlug(user.userType)}/${params.id}${qs ? `?${qs}` : ''}`
    router.replace(target)
  }, [mounted, user, params.id, searchParams, router])

  return <LoadingWorkspace />
}

export default function OrderDetailRedirect() {
  return (
    <Suspense fallback={<LoadingWorkspace />}>
      <OrderDetailRedirectInner />
    </Suspense>
  )
}
