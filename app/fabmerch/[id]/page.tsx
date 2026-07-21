'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import LoadingWorkspace from '../../components/LoadingWorkspace'

export default function TalentProfileRedirect() {
  const router = useRouter()
  const params = useParams<{ id: string }>()

  useEffect(() => {
    router.replace(`/brand/fabmerch/${params.id}`)
  }, [params.id, router])

  return <LoadingWorkspace />
}
