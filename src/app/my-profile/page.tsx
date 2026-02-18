"use client"

import React, { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { EmployeeDetailView } from '@/components/employees/EmployeeDetailView'
import { Loader2, AlertTriangle } from 'lucide-react'
import { authAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'

export default function MyProfilePage() {
    const [loading, setLoading] = useState(true)
    const [userData, setUserData] = useState<any>(null)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await authAPI.loginUserData()
                if (response?.success && response?.data) {
                    setUserData(response.data)
                } else {
                    setError('Failed to fetch user profile')
                }
            } catch (err) {
                console.error('Failed to load profile:', err)
                setError('Failed to load user profile')
            } finally {
                setLoading(false)
            }
        }
        fetchUser()
    }, [])

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
                </div>
            </MainLayout>
        )
    }

    if (error || !userData) {
        return (
            <MainLayout>
                <div className="flex flex-col items-center justify-center h-96 gap-4">
                    <AlertTriangle className="w-12 h-12 text-amber-500" />
                    <p className="text-gray-500">{error || 'User not found'}</p>
                </div>
            </MainLayout>
        )
    }

    if (!userData.employeeId) {
        return (
            <MainLayout>
                <div className="max-w-3xl mx-auto space-y-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                        <div className="px-6 pb-6 relative">
                            <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-12 mb-6 gap-4">
                                <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-800 flex items-center justify-center text-3xl font-bold text-blue-600 shadow-md">
                                    {userData.firstName?.[0]}{userData.lastName?.[0]}
                                </div>
                                <div className="flex-1 text-center sm:text-left mb-2">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {userData.firstName} {userData.lastName}
                                    </h2>
                                    <p className="text-gray-500 dark:text-gray-400">{userData.roleName || 'User'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500 uppercase">Email</label>
                                    <p className="text-gray-900 dark:text-white font-medium">{userData.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500 uppercase">User ID</label>
                                    <p className="text-gray-900 dark:text-white font-medium">{userData.id}</p>
                                </div>
                                <div className="col-span-1 md:col-span-2 mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-900 text-sm text-yellow-800 dark:text-yellow-200">
                                    Note: Your account is not directly linked to an detailed employee record, so full employee details (salary, documents, etc.) are not available.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </MainLayout>
        )
    }

    return <EmployeeDetailView empId={userData.employeeId} />
}
