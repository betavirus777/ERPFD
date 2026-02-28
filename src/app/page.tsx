"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth"
import { usePermission } from "@/hooks/usePermission"

export default function Home() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { can, PERMISSIONS } = usePermission()

  useEffect(() => {
    if (isAuthenticated) {
      if (can(PERMISSIONS.EMPLOYEE_EDIT_OTHERS)) {
        router.push("/dashboard")
      } else {
        router.push("/my-dashboard")
      }
    } else {
      router.push("/login")
    }
  }, [isAuthenticated, router, can, PERMISSIONS])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-pulse">
        <span className="text-white font-bold text-2xl">FD</span>
      </div>
    </div>
  )
}
