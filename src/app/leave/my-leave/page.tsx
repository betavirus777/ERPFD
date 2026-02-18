"use client"

import React, { useEffect, useState, useCallback } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'

import {
  CalendarDays,
  Clock,
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Calendar
} from 'lucide-react'
import { leaveAPI } from '@/lib/api'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { SearchableSelect } from '@/components/ui/searchable-select'

interface LeaveRequest {
  id: number
  leaveType: string
  fromDate: string
  toDate: string
  numberOfDays: number
  reason: string
  statusId: number
  statusName: string
  appliedDate: string
  reasonOfCancellation?: string
  description?: string
}


interface LeaveBalance {
  leaveTypeId: number
  leaveTypeName: string
  totalLeaves: number
  usedLeaves: number
  pendingLeaves: number
  availableLeaves: number
  color?: string
}

const getStatusColor = (status: number) => {
  switch (status) {
    case 1: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 2: return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 3: return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 4: return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' // Rejected
    case 27: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' // Cancelled
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  }
}

const getStatusIcon = (status: number) => {
  switch (status) {
    case 1: return <Clock className="w-4 h-4" />
    case 2: return <CheckCircle className="w-4 h-4" />
    case 3: return <XCircle className="w-4 h-4" />
    case 4: return <XCircle className="w-4 h-4" />
    default: return <AlertCircle className="w-4 h-4" />
  }
}

const columns: ColumnDef<LeaveRequest>[] = [
  {
    accessorKey: "leaveType",
    header: "Leave Type",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 font-medium">
        <FileText className="w-4 h-4 text-blue-500" />
        {row.getValue("leaveType")}
      </div>
    )
  },
  {
    accessorKey: "fromDate",
    header: "Duration",
    cell: ({ row }) => {
      return (
        <div className="text-sm">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gray-400" />
            {new Date(row.original.fromDate).toLocaleDateString()} - {new Date(row.original.toDate).toLocaleDateString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {row.original.numberOfDays} days
          </div>
        </div>
      )
    }
  },
  {
    accessorKey: "description",
    header: "Reason",
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate text-sm text-gray-600 dark:text-gray-400" title={row.original.description || row.original.reason}>
        {row.original.description || row.original.reason || '-'}
      </div>
    )
  },
  {
    accessorKey: "statusName",
    header: "Status",
    cell: ({ row }) => (
      <Badge className={cn("font-normal", getStatusColor(row.original.statusId))}>
        <span className="flex items-center gap-1">
          {getStatusIcon(row.original.statusId)}
          {row.getValue("statusName")}
        </span>
      </Badge>
    )
  },
  {
    accessorKey: "created_at", // API returns createdAt or check
    header: "Applied On",
    cell: ({ row }) => row.original.appliedDate ? new Date(row.original.appliedDate).toLocaleDateString() : '-'
  }
]

import { ApplyLeaveDialog } from '@/components/leave/ApplyLeaveDialog'

// ... existing code ...

export default function MyLeavePage() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [leaveTypes, setLeaveTypes] = useState<any[]>([])
  const [applyModalOpen, setApplyModalOpen] = useState(false)

  // States related to table
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})

  // Fetch balances separately
  const fetchBalances = async () => {
    try {
      const balanceRes = await fetch(`/api/leave/balance`) // No uid needed - uses auth token
      const data = await balanceRes.json()
      if (data.success) {
        setLeaveBalances(data.data || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Fetch types separately or once
  const fetchTypes = async () => {
    try {
      const res = await fetch(`/api/masters/leave-types`)
      const data = await res.json()
      if (data.success) setLeaveTypes(data.data || [])
    } catch (e) { console.error(e) }
  }

  const fetchLeaveRequests = useCallback(async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        personal: 'true', // Flag to tell backend to use auth token
        page: page.toString(),
        limit: limit.toString(),
        ...(activeFilters.leaveTypeId && { leave_type: activeFilters.leaveTypeId }),
        ...(activeFilters.statusId && { status: activeFilters.statusId })
      })
      const res = await fetch(`/api/leave?${queryParams}`)
      const data = await res.json()
      if (data.success) {
        setLeaveRequests(data.data || [])
        if (data.pagination) {
          setTotal(data.pagination.total)
        }
      }
    } catch (error) {
      console.error("Failed to fetch leaves", error)
    } finally {
      setLoading(false)
    }
  }, [page, limit, activeFilters])

  const handleFilterChange = (filters: Record<string, string>) => {
    setActiveFilters(filters)
    setPage(1)
  }

  const filterConfigs = [
    {
      key: 'leaveTypeId',
      label: 'Leave Type',
      options: leaveTypes.map(t => ({ label: t.name || t.leaveTypeName, value: String(t.id) }))
    },
    {
      key: 'statusId',
      label: 'Status',
      options: [
        { label: 'Pending', value: '1' },
        { label: 'Approved', value: '2' },
        { label: 'Rejected', value: '4' },
        { label: 'Cancelled', value: '27' },
      ]
    }
  ]

  useEffect(() => {
    fetchBalances()
    fetchTypes()
  }, [])

  useEffect(() => {
    fetchLeaveRequests()
  }, [fetchLeaveRequests])

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[calc(100vh-120px)]">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <CalendarDays className="w-8 h-8 text-blue-600" />
              My Leave
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage your leave applications and view balance
            </p>
          </div>
          <Button onClick={() => setApplyModalOpen(true)} className="bg-[#1e3a5f] hover:bg-[#2d5a87]">
            <Plus className="w-4 h-4 mr-2" />
            Apply Leave
          </Button>
        </div>

        {/* Leave Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {leaveBalances.map((balance) => {
            const usagePercent = balance.totalLeaves > 0
              ? ((balance.usedLeaves + balance.pendingLeaves) / balance.totalLeaves) * 100
              : 0

            // Dynamic styling based on leave type
            let colorClass = "bg-blue-500"
            let bgClass = "bg-blue-50 dark:bg-blue-900/10"
            let icon = <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />

            const name = balance.leaveTypeName.toLowerCase()
            if (name.includes('sick') || name.includes('medical')) {
              colorClass = "bg-red-500"
              bgClass = "bg-red-50 dark:bg-red-900/10"
              icon = <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            } else if (name.includes('casual')) {
              colorClass = "bg-green-500"
              bgClass = "bg-green-50 dark:bg-green-900/10"
              icon = <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
            } else if (name.includes('privilege') || name.includes('annual')) {
              colorClass = "bg-indigo-500"
              bgClass = "bg-indigo-50 dark:bg-indigo-900/10"
              icon = <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            }

            return (
              <Card key={balance.leaveTypeId} className={cn("relative overflow-hidden border-t-4 transition-all hover:shadow-md", bgClass,
                name.includes('sick') ? "border-t-red-500" :
                  name.includes('casual') ? "border-t-green-500" :
                    name.includes('privilege') ? "border-t-indigo-500" : "border-t-blue-500"
              )}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {balance.leaveTypeName}
                  </CardTitle>
                  {icon}
                </CardHeader>
                <CardContent>
                  <div className="mt-2 space-y-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        {balance.availableLeaves}
                      </span>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded-full border shadow-sm">
                        of {balance.totalLeaves} days
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Used: {balance.usedLeaves}</span>
                        <span>Pending: {balance.pendingLeaves}</span>
                      </div>
                      <Progress value={usagePercent} className="h-2" indicatorClassName={colorClass} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Leave Requests */}
        <Card>
          <CardHeader>
            <CardTitle>My Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Replaced manual list with DataTable */}
            <DataTable
              columns={columns}
              data={leaveRequests}
              isLoading={loading}
              serverSide={true}
              totalItems={total}
              currentPage={page}
              pageSize={limit}
              onPageChange={setPage}
              onPageSizeChange={setLimit}
              filters={filterConfigs}
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
            />
          </CardContent>
        </Card>

      </div>

      <ApplyLeaveDialog
        open={applyModalOpen}
        onOpenChange={setApplyModalOpen}
        onSuccess={() => {
          fetchLeaveRequests()
          fetchBalances()
        }}
        leaveTypes={leaveTypes}
      />
    </MainLayout>
  )
}


