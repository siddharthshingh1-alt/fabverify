'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '../context/UserContext'
import type { UserType } from '../context/UserContext'
import { getBasePath } from '../lib/routing'
import LoadingWorkspace from '../components/LoadingWorkspace'

const TALENT_TYPES: UserType[] = ['designer', 'master', 'merchandiser', 'qc_inspector']

export default function FabMerchRedirect() {
  const router = useRouter()
  const { user, mounted } = useUser()

  useEffect(() => {
    if (!mounted) return
    router.replace(
      TALENT_TYPES.includes(user.userType) ? `${getBasePath(user.userType)}/profile` : '/brand/fabmerch'
    )
  }, [mounted, user, router])

  return <LoadingWorkspace />
}
