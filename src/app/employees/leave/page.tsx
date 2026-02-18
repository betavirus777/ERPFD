'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export default function EmployeeLeaveRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/leave')
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-500">Redirecting to leave management...</p>
      </div>
    </div>
  )
}
