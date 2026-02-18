"use client"

import React, { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
    CalendarDays,
    FileText,
    Clock,
    CheckCircle,
    AlertTriangle,
    Plane,
    Gift,
    ArrowRight,
    Loader2
} from 'lucide-react'
import Link from 'next/link'
import { format, differenceInYears, differenceInDays } from 'date-fns'

export default function UserDashboard() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/dashboard/user')
                const result = await response.json()
                if (result.success) {
                    setData(result.data)
                }
            } catch (error) {
                console.error('Failed to fetch user dashboard:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </MainLayout>
        )
    }

    if (!data) {
        return (
            <MainLayout>
                <div className="text-center py-12">
                    <p className="text-gray-500">Failed to load dashboard data</p>
                </div>
            </MainLayout>
        )
    }

    const { employee, leaveStats, upcomingLeaves, expiringDocuments, documentRequests } = data
    const usagePercentage = leaveStats.totalAllocated > 0
        ? Math.round((leaveStats.totalUsed / leaveStats.totalAllocated) * 100)
        : 0

    const tenure = employee.doj
        ? differenceInYears(new Date(), new Date(employee.doj))
        : 0

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Welcome Header */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8b] p-8 text-white">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/10 to-transparent" />
                    <div className="flex items-center gap-6">
                        <Avatar className="h-20 w-20 border-4 border-white/20 shadow-xl">
                            <AvatarImage src={employee.photo} />
                            <AvatarFallback className="bg-white/20 text-white text-xl">
                                {employee.name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-bold">Welcome back, {employee.name?.split(' ')[0]}!</h1>
                            <p className="text-white/80 mt-1">{employee.designation}</p>
                            <div className="flex items-center gap-4 mt-3">
                                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                                    {employee.code}
                                </Badge>
                                {tenure > 0 && (
                                    <span className="text-white/60 text-sm flex items-center gap-1">
                                        <Gift className="w-4 h-4" />
                                        {tenure} {tenure === 1 ? 'year' : 'years'} with us
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Leave Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-emerald-600 font-medium">Leave Balance</p>
                                    <p className="text-3xl font-bold text-emerald-700">{leaveStats.totalBalance}</p>
                                    <p className="text-xs text-emerald-500 mt-1">days remaining</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <CalendarDays className="h-6 w-6 text-emerald-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-blue-600 font-medium">Leave Used</p>
                                    <p className="text-3xl font-bold text-blue-700">{leaveStats.totalUsed}</p>
                                    <p className="text-xs text-blue-500 mt-1">of {leaveStats.totalAllocated} days</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Plane className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-100">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-amber-600 font-medium">Pending Requests</p>
                                    <p className="text-3xl font-bold text-amber-700">{leaveStats.pendingLeaves}</p>
                                    <p className="text-xs text-amber-500 mt-1">awaiting approval</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                                    <Clock className="h-6 w-6 text-amber-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-purple-600 font-medium">Approved This Year</p>
                                    <p className="text-3xl font-bold text-purple-700">{leaveStats.approvedLeavesCount}</p>
                                    <p className="text-xs text-purple-500 mt-1">leave requests</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                                    <CheckCircle className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Leave Breakdown */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Leave Breakdown</CardTitle>
                                <CardDescription>Your leave allocation for this year</CardDescription>
                            </div>
                            <Link href="/leave/my-leave">
                                <Button variant="ghost" size="sm" className="text-blue-600">
                                    View All <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {leaveStats.allocations.length > 0 ? (
                                    leaveStats.allocations.map((alloc: any, i: number) => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium">{alloc.leaveType}</span>
                                                <span className="text-gray-500">
                                                    {alloc.used} / {alloc.allocated} days used
                                                </span>
                                            </div>
                                            <Progress
                                                value={alloc.allocated > 0 ? (alloc.used / alloc.allocated) * 100 : 0}
                                                className="h-2"
                                            />
                                            <div className="text-xs text-gray-400">
                                                {alloc.balance} days remaining
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <CalendarDays className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                        <p>No leave allocations found for this year</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Upcoming Leaves */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Upcoming Leaves</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {upcomingLeaves.length > 0 ? (
                                <div className="space-y-3">
                                    {upcomingLeaves.map((leave: any) => (
                                        <div key={leave.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                                                {format(new Date(leave.fromDate), 'd')}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{leave.leaveType}</p>
                                                <p className="text-xs text-gray-500">
                                                    {format(new Date(leave.fromDate), 'MMM d')} - {format(new Date(leave.toDate), 'MMM d')}
                                                </p>
                                            </div>
                                            <Badge variant="outline">{leave.days}d</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <Plane className="w-8 h-8 mx-auto mb-2" />
                                    <p className="text-sm">No upcoming leaves</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* My Documents Expiry */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                                    Document Expiry Alerts
                                </CardTitle>
                                <CardDescription>Documents expiring in the next 6 months</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {expiringDocuments.length > 0 ? (
                                <div className="space-y-3">
                                    {expiringDocuments.map((doc: any) => (
                                        <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-5 h-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm font-medium">{doc.documentType}</p>
                                                    <p className="text-xs text-gray-500">{doc.documentNumber || 'No number'}</p>
                                                </div>
                                            </div>
                                            <Badge variant={doc.daysToExpiry < 30 ? "destructive" : "secondary"}>
                                                {doc.daysToExpiry < 0 ? 'Expired' : `${doc.daysToExpiry} days`}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                                    <p className="text-sm">All documents are valid</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* My Document Requests */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Document Requests</CardTitle>
                                <CardDescription>Your recent document requests</CardDescription>
                            </div>
                            <Link href="/document-requests">
                                <Button variant="ghost" size="sm" className="text-blue-600">
                                    View All <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {documentRequests.length > 0 ? (
                                <div className="space-y-3">
                                    {documentRequests.map((req: any) => (
                                        <div key={req.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <div>
                                                <p className="text-sm font-medium">{req.documentType}</p>
                                                <p className="text-xs text-gray-500">
                                                    {format(new Date(req.createdAt), 'MMM d, yyyy')}
                                                </p>
                                            </div>
                                            <Badge variant={
                                                req.status === 'Completed' ? 'default' :
                                                    req.status === 'Rejected' ? 'destructive' :
                                                        'secondary'
                                            }>
                                                {req.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <FileText className="w-8 h-8 mx-auto mb-2" />
                                    <p className="text-sm">No document requests yet</p>
                                    <Link href="/document-requests">
                                        <Button variant="link" size="sm" className="mt-2">
                                            Request a document
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    )
}
