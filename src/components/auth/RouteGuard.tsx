"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { ShieldX } from 'lucide-react'
import { usePermission } from '@/hooks/usePermission'
import { Button } from '@/components/ui/button'

interface RouteGuardProps {
    /** Permission key required to access this route */
    permission?: string
    /** Multiple permissions — user needs at least one */
    anyOf?: string[]
    /** Require all permissions */
    allOf?: string[]
    /** If true, only admins can access */
    adminOnly?: boolean
    children: React.ReactNode
}

/**
 * RouteGuard — wraps a page and shows an Access Denied screen
 * if the logged-in user doesn't have the required permission.
 * 
 * Usage:
 *   <RouteGuard permission={PERMISSIONS.CANDIDATE_VIEW}>
 *     <PageContent />
 *   </RouteGuard>
 */
export function RouteGuard({ permission, anyOf, allOf, adminOnly, children }: RouteGuardProps) {
    const { can, canAny, canAll, user, PERMISSIONS } = usePermission()
    const router = useRouter()

    // Wait until user is hydrated from localStorage
    if (!user) return null

    let hasAccess = true

    if (adminOnly) hasAccess = can(PERMISSIONS.VIEW_ALL_EMPLOYEES)
    else if (permission) hasAccess = can(permission)
    else if (anyOf) hasAccess = canAny(anyOf)
    else if (allOf) hasAccess = canAll(allOf)

    if (!hasAccess) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-4">
                <div className="p-6 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
                    <ShieldX className="w-14 h-14 text-red-400" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Access Denied</h2>
                    <p className="text-gray-500 text-sm max-w-sm">
                        You don&apos;t have permission to view this page. Contact your administrator if you need access.
                    </p>
                </div>
                <Button variant="outline" onClick={() => router.back()}>
                    Go Back
                </Button>
            </div>
        )
    }

    return <>{children}</>
}
