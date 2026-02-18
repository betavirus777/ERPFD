"use client"

import React, { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { useAuthStore } from '@/store/auth'
import { dashboardAPI, employeesAPI, leaveAPI } from '@/lib/api'
import {
  Users,
  FolderKanban,
  Building2,
  FileText,
  ArrowUpRight,
  ChevronRight,
  Loader2,
  Gift,
  Cake,
  CalendarDays,
  Plane,
  AlertTriangle,
  FileWarning,
  Clock,
  Briefcase
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { format, differenceInDays } from 'date-fns'
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    activeClients: 0,
    activeProjects: 0,
    opportunities: 0,
    onLeaveToday: 0,
    pendingDocuments: 0,
    pendingLeaves: 0,
    monthlyLeaveCount: 0
  })

  const [recentLeaves, setRecentLeaves] = useState<any[]>([])
  const [expiringDocs, setExpiringDocs] = useState<any[]>([])
  const [anniversaries, setAnniversaries] = useState<any[]>([])
  const [monthlyLeaves, setMonthlyLeaves] = useState<any[]>([])

  useEffect(() => {
    const init = async () => {
      if (user) {
        await fetchDashboardData()
      }
    }
    init()
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const [statsRes, leavesRes, anniversariesRes] = await Promise.allSettled([
        fetch('/api/dashboard/stats'),
        leaveAPI.getAll({ limit: 20 }), // Get more to filter locally
        fetch('/api/employees/anniversaries?limit=5'),
      ])

      // Process stats headers
      if (statsRes.status === 'fulfilled') {
        const data = await statsRes.value.json()
        if (data.success) {
          setStats(data.data)
          setExpiringDocs(data.data.expiringDocumentsList || [])
          setMonthlyLeaves(data.data.monthlyLeaveList || [])
        }
      }

      // Process leaves - Filter for upcoming in 6 months and prioritize closest 5
      if (leavesRes.status === 'fulfilled' && leavesRes.value?.data) {
        const allLeaves = leavesRes.value.data
        const today = new Date()
        const sixMonthsFromNow = new Date()
        sixMonthsFromNow.setMonth(today.getMonth() + 6)

        const upcoming = allLeaves.filter((l: any) => {
          const startDate = new Date(l.fromDate || l.from_date)
          // Show Approved and Pending
          return startDate >= today && startDate <= sixMonthsFromNow
        }).sort((a: any, b: any) => {
          return new Date(a.fromDate || a.from_date).getTime() - new Date(b.fromDate || b.from_date).getTime()
        }).slice(0, 5)

        setRecentLeaves(upcoming)
      }

      // Process anniversaries
      if (anniversariesRes.status === 'fulfilled') {
        const data = await anniversariesRes.value.json()
        if (data.success && data.data) {
          setAnniversaries(data.data)
        }
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[calc(100vh-120px)]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-8 pb-8 animate-in fade-in duration-500">

        {/* Hero Section */}
        <div className="relative overflow-visible rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -ml-20 -mb-20" />

          <div className="relative z-10 p-8 md:p-10 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <div className="flex items-center gap-2 text-blue-300 font-medium mb-2">
                  <span className="h-1 w-1 rounded-full bg-blue-400" />
                  {format(new Date(), 'EEEE, MMMM do, yyyy')}
                </div>
                <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
                  {getGreeting()}, {user?.firstName}
                </h1>
                <p className="mt-2 text-slate-400 max-w-lg">
                  Here's what's happening in your organization today. You have <span className="text-blue-400 font-semibold">{stats.pendingDocuments} document alerts</span> and <span className="text-purple-400 font-semibold">{recentLeaves.length} upcoming leaves</span>.
                </p>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 text-white" asChild>
                  <Link href="/reports/expiry">View Alerts</Link>
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                  Dashboard Actions
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title="Total Employees"
            value={stats.totalEmployees}
            subtitle={`${stats.activeEmployees} Active`}
            icon={Users}
            trend="+2.5%"
            color="blue"
            href="/employees"
          />
          <StatsCard
            title="Active Clients"
            value={stats.activeClients}
            subtitle="Growing Portfolio"
            icon={Building2}
            trend="+12%"
            color="indigo"
            href="/clients"
          />
          <StatsCard
            title="Active Projects"
            value={stats.activeProjects}
            subtitle="In Progress"
            icon={FolderKanban}
            trend="+5%"
            color="emerald"
            href="/projects"
          />
          <StatsCard
            title="On Leave Today"
            value={stats.onLeaveToday}
            subtitle="Employees Away"
            icon={Plane}
            trend="Now"
            color="rose"
            href="/leave"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Passport & Visa Expiry Widget */}
          <Card className="col-span-1 lg:col-span-2 shadow-sm border-slate-100 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <FileWarning className="w-5 h-5 text-amber-500" />
                  Passport & Visa Expiry
                </CardTitle>
                <CardDescription>Documents expiring in the next 6 months</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" asChild>
                <Link href="/reports/expiry" className="flex items-center gap-1">
                  View Details <ArrowUpRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {expiringDocs.length > 0 ? (
                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  <div className="grid grid-cols-12 bg-slate-50/50 p-3 text-xs font-medium text-slate-500 border-b border-slate-100">
                    <div className="col-span-4">Employee</div>
                    <div className="col-span-3">Document</div>
                    <div className="col-span-3">Expiry Date</div>
                    <div className="col-span-2 text-right">Status</div>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {expiringDocs.slice(0, 5).map((doc: any) => (
                      <div key={doc.id} className="grid grid-cols-12 p-4 items-center hover:bg-slate-50 transition-colors">
                        <div className="col-span-4 flex items-center gap-3">
                          <Avatar className="h-8 w-8 bg-slate-100 border border-slate-200">
                            <AvatarFallback className="text-xs text-slate-600 bg-slate-100">{doc.name ? doc.name.substring(0, 2).toUpperCase() : '?'}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-slate-700 truncate">{doc.name}</span>
                        </div>
                        <div className="col-span-3">
                          <Badge variant="outline" className="bg-white font-normal text-slate-600">
                            {doc.documentType}
                          </Badge>
                        </div>
                        <div className="col-span-3 text-sm text-slate-600">
                          {format(new Date(doc.expiryDate), 'MMM dd, yyyy')}
                        </div>
                        <div className="col-span-2 text-right">
                          <Badge variant={doc.daysToExpiry < 30 ? "destructive" : "secondary"} className={doc.daysToExpiry < 30 ? "" : "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200"}>
                            {doc.daysToExpiry} days
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-medium text-slate-900">All Good!</h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-xs">No passports or visas are expiring within the next 6 months.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Widgets Column */}
          <div className="space-y-6">

            {/* Monthly Leaves Widget */}
            <Card className="shadow-sm border-slate-100 dark:border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Plane className="w-4 h-4 text-rose-500" />
                  Employees On Leave This Month
                </CardTitle>
                <CardDescription className="text-xs">{format(new Date(), 'MMMM yyyy')}</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <div className="h-[280px] px-6 overflow-y-auto">
                  <div className="space-y-3">
                    {monthlyLeaves.length > 0 ? monthlyLeaves.map((leave: any, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                          <AvatarImage src={leave.employeePhoto} />
                          <AvatarFallback className="bg-rose-100 text-rose-700 text-xs">
                            {leave.employeeName?.substring(0, 2).toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{leave.employeeName}</p>
                          <p className="text-xs text-slate-500">
                            {format(new Date(leave.fromDate), 'MMM d')} - {format(new Date(leave.toDate), 'MMM d')}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs bg-white">
                            {leave.days} days
                          </Badge>
                          <p className="text-[10px] text-slate-400 mt-1">{leave.leaveType}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8">
                        <Plane className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No employees on leave this month</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Celebrations */}
            <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-pink-900">
                  <Gift className="w-4 h-4 text-pink-500" />
                  Celebrations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {anniversaries.slice(0, 3).map((event: any, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/60 p-2.5 rounded-lg border border-pink-100/50">
                      <div className={`p-2 rounded-full ${event.type === 'birthday' ? 'bg-pink-100 text-pink-600' : 'bg-amber-100 text-amber-600'}`}>
                        {event.type === 'birthday' ? <Cake className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{event.name}</p>
                        <p className="text-xs text-slate-500">
                          {event.type === 'birthday' ? 'Birthday' : `${event.years}y Anniversary`} • {event.date}
                        </p>
                      </div>
                    </div>
                  ))}
                  {anniversaries.length === 0 && (
                    <p className="text-xs text-center text-pink-400 py-2">No upcoming celebrations</p>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </MainLayout>
  )
}

function StatsCard({ title, value, subtitle, icon: Icon, trend, color, href }: any) {
  const colorStyles: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100"
  }

  return (
    <Link href={href} className="group block">
      <Card className="border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 hover:border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className={`p-3 rounded-xl ${colorStyles[color]} group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="w-6 h-6" />
            </div>
            {trend && (
              <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{trend}</span>
            )}
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">{title}</p>
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
