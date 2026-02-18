"use client"

import React, { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { leaveAPI, mastersAPI, employeesAPI } from '@/lib/api'
import { SearchableSelect } from "@/components/ui/searchable-select"
import { useAuthStore } from '@/store/auth'
import { usePermission } from '@/hooks/usePermission'
import {
  Calendar, Clock, CheckCircle, XCircle, AlertCircle, Plus, Search,
  MoreHorizontal, Eye, Loader2, RefreshCw, Filter, FileText,
  CalendarDays, Users, TrendingUp, Upload, Download, Ban, RotateCcw,
  UserCheck, Paperclip, X, ExternalLink
} from 'lucide-react'

interface LeaveApplication {
  id: number
  employeeId: string
  employeeName: string
  employeePhoto?: string
  employeeCode?: string
  designation: string
  leaveType: string
  leaveTypeId?: number
  fromDate: string
  toDate: string
  numberOfDays: number
  description?: string
  statusId: number
  statusName: string
  fileUpload?: string
  createdAt: string
  reasonOfCancellation?: string
  totalLeaveCount?: number
  remainingLeaveCount?: number
}

interface LeaveType {
  id: number
  leaveType: string
  maxLeaveCount: number
}

interface Employee {
  id: number
  uid: string
  firstName: string
  lastName: string
  email: string
  employeeCode: string
}

interface LeaveBalance {
  leaveType: string
  leaveTypeName: string
  allocated: number
  used: number
  pending?: number
  remaining: number
}

const STATUS_COLORS: Record<string, string> = {
  'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Approved': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'Rejected': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'Cancelled': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  'Request For Cancellation': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
}

const STATUS_IDS = {
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 4,
  CANCELLED: 27,
  REQUEST_CANCELLATION: 26,
}

import { ApplyLeaveDialog } from '@/components/leave/ApplyLeaveDialog'
// ... (keep existing imports)

// ... (keep Layout and interfaces)

function LeavePageContent() {
  const { user } = useAuthStore()
  const { isAdmin, canApproveLeave, can } = usePermission()
  const searchParams = useSearchParams()

  // Refs to track initialization and prevent duplicate calls
  const initialFetchDone = useRef(false)
  const userIsAdmin = useRef(false)

  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })

  // Tabs and Filters
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Modals
  const [applyModalOpen, setApplyModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [approvalModalOpen, setApprovalModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [adminApplyModalOpen, setAdminApplyModalOpen] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState<LeaveApplication | null>(null)

  // Cancellation form
  const [cancelReason, setCancelReason] = useState('')
  const [approvalComment, setApprovalComment] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Modal-specific errors
  const [approvalError, setApprovalError] = useState('')
  const [cancelError, setCancelError] = useState('')


  // Update admin ref when permission changes
  useEffect(() => {
    userIsAdmin.current = isAdmin()
  }, [isAdmin])

  const getStatusFilter = useCallback((tab: string) => {
    switch (tab) {
      case 'pending': return STATUS_IDS.PENDING
      case 'approved': return STATUS_IDS.APPROVED
      case 'rejected': return STATUS_IDS.REJECTED
      case 'cancelled': return STATUS_IDS.CANCELLED
      case 'cancellation-requests': return STATUS_IDS.REQUEST_CANCELLATION
      default: return undefined
    }
  }, [])

  // Fetch leave applications - optimized
  const fetchLeaveApplicationsInternal = useCallback(async (
    currentPage: number,
    currentTab: string,
    currentLeaveTypeFilter: string,
    currentEmployeeFilter: string,
    currentSearch: string
  ) => {
    try {
      setLoading(true)
      const params: Record<string, any> = { page: currentPage, limit: 10 }

      const statusId = getStatusFilter(currentTab)
      if (statusId) params.status = statusId
      if (currentLeaveTypeFilter) params.leave_type = currentLeaveTypeFilter
      if (currentEmployeeFilter) params.employee_id = currentEmployeeFilter
      if (currentSearch) params.search = currentSearch

      // For non-admin, only show their own leaves
      if (!userIsAdmin.current && user?.id) {
        params.employee_id = user.id
      }

      const response = await leaveAPI.getAll(params)
      if (response?.data) {
        setLeaveApplications(response.data)
        setStats(response.stats || { total: 0, pending: 0, approved: 0, rejected: 0 })
        setTotalPages(response.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error('Failed to fetch leave applications:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id, getStatusFilter])

  // Convenience function to refresh with current state
  const refreshLeaveApplications = useCallback(async () => {
    await fetchLeaveApplicationsInternal(page, activeTab, leaveTypeFilter, employeeFilter, search)
  }, [fetchLeaveApplicationsInternal, page, activeTab, leaveTypeFilter, employeeFilter, search])

  // Fetch leave balance
  const fetchLeaveBalance = useCallback(async (uid?: string) => {
    const targetUid = uid || user?.id
    if (!targetUid) return
    try {
      const response = await leaveAPI.getBalance(targetUid)
      if (response?.data) {
        setLeaveBalance(response.data)
      } else {
        setLeaveBalance([])
      }
    } catch (error) {
      console.error('Failed to fetch leave balance:', error)
      setLeaveBalance([])
    }
  }, [user?.id])

  // Initial data fetch - runs ONCE
  useEffect(() => {
    if (initialFetchDone.current || !user?.id) return
    initialFetchDone.current = true

    const fetchInitialData = async () => {
      setLoading(true)

      try {
        // Fetch all data in parallel
        const promises: Promise<any>[] = [
          leaveAPI.getAll({ page: 1, limit: 10, employee_id: userIsAdmin.current ? undefined : user.id }),
          mastersAPI.getLeaveTypes(),
          leaveAPI.getBalance(user.id),
        ]

        // Only fetch employees for admin (with minimal fields for dropdown)
        if (userIsAdmin.current) {
          promises.push(employeesAPI.getAll({ limit: 100, minimal: 'true' }))
        }

        const results = await Promise.all(promises)

        // Leave applications
        if (results[0]?.data) {
          setLeaveApplications(results[0].data)
          setStats(results[0].stats || { total: 0, pending: 0, approved: 0, rejected: 0 })
          setTotalPages(results[0].pagination?.totalPages || 1)
        }

        // Leave types
        if (results[1]?.data) {
          setLeaveTypes(results[1].data)
        }

        // Leave balance
        if (results[2]?.data) {
          setLeaveBalance(results[2].data)
        }

        // Employees (admin only)
        if (results[3]?.data) {
          setEmployees(results[3].data)
        }
      } catch (error) {
        console.error('Failed to fetch initial data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [user?.id])

  // Refetch when filters change (debounced)
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!initialFetchDone.current) return

    // Clear previous timeout
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current)
    }

    // Debounce filter changes
    filterTimeoutRef.current = setTimeout(() => {
      fetchLeaveApplicationsInternal(page, activeTab, leaveTypeFilter, employeeFilter, search)

      // Fetch balance for selected employee if admin
      if (userIsAdmin.current) {
        if (employeeFilter && employeeFilter.trim() !== '') {
          fetchLeaveBalance(employeeFilter)
        } else {
          setLeaveBalance([]) // Clear balance if looking at all employees
        }
      }
    }, 300)

    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current)
      }
    }
  }, [page, activeTab, leaveTypeFilter, employeeFilter, search, fetchLeaveApplicationsInternal, fetchLeaveBalance])

  // Auto-open apply modal from header quick action
  useEffect(() => {
    if (searchParams?.get('apply') === 'true') {
      setApplyModalOpen(true)
    }
  }, [searchParams])





  const handleApproveReject = async (action: 'approve' | 'reject') => {
    if (!selectedLeave) return

    try {
      setSaving(true)
      setError('')

      const type = action === 'approve' ? 1 : 0
      const response = await leaveAPI.approve(selectedLeave.id, {
        type,
        reason: approvalComment
      })

      if (response.success) {
        setSuccess(`Leave ${action === 'approve' ? 'approved' : 'rejected'} successfully!`)
        setApprovalModalOpen(false)
        setSelectedLeave(null)
        setApprovalComment('')
        refreshLeaveApplications()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (error: any) {
      setError(error.message || `Failed to ${action} leave`)
    } finally {
      setSaving(false)
    }
  }

  const handleRequestCancellation = async () => {
    if (!selectedLeave || !cancelReason) {
      setError('Please provide a reason for cancellation')
      return
    }

    try {
      setSaving(true)
      setError('')

      const response = await leaveAPI.approve(selectedLeave.id, {
        type: 3, // Request for cancellation
        reason: cancelReason
      })

      if (response.success) {
        setSuccess('Cancellation request submitted successfully!')
        setCancelModalOpen(false)
        setSelectedLeave(null)
        setCancelReason('')
        refreshLeaveApplications()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (error: any) {
      setError(error.message || 'Failed to request cancellation')
    } finally {
      setSaving(false)
    }
  }

  const handleApproveCancellation = async () => {
    if (!selectedLeave) return

    try {
      setSaving(true)
      setError('')

      const response = await leaveAPI.approve(selectedLeave.id, { type: 4 }) // Approve cancellation

      if (response.success) {
        setSuccess('Leave cancellation approved!')
        setApprovalModalOpen(false)
        setSelectedLeave(null)
        refreshLeaveApplications()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (error: any) {
      setError(error.message || 'Failed to approve cancellation')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getInitials = (name: string) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }



  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Leave Management
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {isAdmin() ? 'Manage and approve leave applications' : 'Apply and track your leave applications'}
            </p>
          </div>
          <div className="flex gap-2">
            {isAdmin() && (
              <Button
                variant="outline"
                onClick={() => setAdminApplyModalOpen(true)}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Apply for Employee
              </Button>
            )}
            <Button onClick={() => setApplyModalOpen(true)} className="bg-[#1e3a5f] hover:bg-[#163050]">
              <Plus className="w-4 h-4 mr-2" />
              Apply Leave
            </Button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-red-600 hover:text-red-800">&times;</button>
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}

        {/* Leave Balance Cards (for employees or admin view of employee) */}
        {((!isAdmin() || (isAdmin() && employeeFilter && employeeFilter.trim() !== '')) && leaveBalance.length > 0) && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {leaveBalance.map((balance) => (
              <Card key={balance.leaveType} className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{balance.leaveTypeName}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold text-[#1e3a5f] dark:text-blue-400">{balance.remaining}</span>
                    <span className="text-xs text-gray-400">/ {balance.allocated}</span>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-400">
                    <span>Used: {balance.used}</span>
                    <span>Pending: {balance.pending || 0}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats Cards (for admins) */}
        {isAdmin() && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('all')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <CalendarDays className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                    <p className="text-sm text-gray-500">Total Applications</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('pending')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                    <p className="text-sm text-gray-500">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('approved')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.approved}</p>
                    <p className="text-sm text-gray-500">Approved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('rejected')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rejected}</p>
                    <p className="text-sm text-gray-500">Rejected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <TabsList className="bg-gray-100 dark:bg-gray-800">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">
                Pending
                {stats.pending > 0 && (
                  <Badge className="ml-2 bg-yellow-500 text-white text-xs px-1.5 py-0">{stats.pending}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              {isAdmin() && (
                <TabsTrigger value="cancellation-requests">
                  Cancellation Requests
                </TabsTrigger>
              )}
            </TabsList>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              {isAdmin() && (
                <div className="w-[220px]">
                  <SearchableSelect
                    options={[
                      { value: " ", label: "All Employees" },
                      ...employees.map(emp => ({
                        value: emp.uid,
                        label: `${emp.firstName} ${emp.lastName}`
                      }))
                    ]}
                    value={employeeFilter || " "}
                    onChange={setEmployeeFilter}
                    placeholder="All Employees"
                    searchPlaceholder="Search employee..."
                  />
                </div>
              )}
              <div className="w-[220px]">
                <SearchableSelect
                  options={[
                    { value: " ", label: "All Leave Types" },
                    ...leaveTypes.map(lt => ({
                      value: String(lt.id),
                      label: lt.leaveType
                    }))
                  ]}
                  value={leaveTypeFilter || " "}
                  onChange={setLeaveTypeFilter}
                  placeholder="All Leave Types"
                />
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => { setEmployeeFilter(''); setLeaveTypeFilter(''); setSearch(''); }}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Leave Applications Table */}
          <Card className="mt-4">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
                </div>
              ) : leaveApplications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <Calendar className="w-16 h-16 mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No leave applications found</p>
                  <p className="text-sm">
                    {activeTab === 'pending' ? 'No pending leaves to review' : 'Apply for leave using the button above'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                      {isAdmin() && <TableHead>Employee</TableHead>}
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Evidence</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied On</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveApplications.map((leave) => (
                      <TableRow key={leave.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        {isAdmin() && (
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                {leave.employeePhoto && (
                                  <AvatarImage src={`${process.env.NEXT_PUBLIC_STORAGE_URL}/${leave.employeePhoto}`} />
                                )}
                                <AvatarFallback className="bg-[#1e3a5f] text-white text-xs">
                                  {getInitials(leave.employeeName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white text-sm">{leave.employeeName}</p>
                                <p className="text-xs text-gray-500">{leave.employeeCode}</p>
                              </div>
                            </div>
                          </TableCell>
                        )}
                        <TableCell className="font-medium">{leave.leaveType}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{formatDate(leave.fromDate)}</p>
                            <p className="text-gray-500 text-xs">to {formatDate(leave.toDate)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{leave.numberOfDays}</span>
                          <span className="text-gray-500 text-sm"> days</span>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate">
                            {leave.description || '-'}
                          </p>
                        </TableCell>
                        <TableCell>
                          {leave.fileUpload ? (
                            <a
                              href={leave.fileUpload}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                            >
                              <Paperclip className="w-4 h-4" />
                              <span className="text-xs">View</span>
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[leave.statusName] || 'bg-gray-100'}>
                            {leave.statusName}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {formatDate(leave.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedLeave(leave); setViewModalOpen(true); }}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>

                              {/* Admin approval options for pending leaves */}
                              {isAdmin() && leave.statusName === 'Pending' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => { setSelectedLeave(leave); setApprovalModalOpen(true); }}
                                    className="text-green-600"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => { setSelectedLeave(leave); setApprovalModalOpen(true); }}
                                    className="text-red-600"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}

                              {/* Admin options for cancellation requests */}
                              {isAdmin() && leave.statusName === 'Request For Cancellation' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => { setSelectedLeave(leave); handleApproveCancellation(); }}
                                    className="text-orange-600"
                                  >
                                    <Ban className="w-4 h-4 mr-2" />
                                    Approve Cancellation
                                  </DropdownMenuItem>
                                </>
                              )}

                              {/* Employee cancellation request option */}
                              {!isAdmin() && leave.statusName === 'Approved' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => { setSelectedLeave(leave); setCancelModalOpen(true); }}
                                    className="text-orange-600"
                                  >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Request Cancellation
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </Tabs>
      </div>

      {/* Apply Leave Modal */}
      {/* Apply Leave Modal */}
      <ApplyLeaveDialog
        open={applyModalOpen}
        onOpenChange={setApplyModalOpen}
        onSuccess={() => {
          refreshLeaveApplications()
          fetchLeaveBalance()
        }}
        leaveTypes={leaveTypes}
      />

      {/* Admin Apply Leave Modal */}
      <ApplyLeaveDialog
        open={adminApplyModalOpen}
        onOpenChange={setAdminApplyModalOpen}
        onSuccess={() => {
          refreshLeaveApplications()
        }}
        leaveTypes={leaveTypes}
        isAdminMode={true}
        employees={employees}
      />

      {/* View Leave Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Leave Application Details</DialogTitle>
          </DialogHeader>
          {selectedLeave && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Avatar className="h-14 w-14">
                  {selectedLeave.employeePhoto && (
                    <AvatarImage src={`${process.env.NEXT_PUBLIC_STORAGE_URL}/${selectedLeave.employeePhoto}`} />
                  )}
                  <AvatarFallback className="bg-[#1e3a5f] text-white text-lg">
                    {getInitials(selectedLeave.employeeName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-lg">{selectedLeave.employeeName}</p>
                  <p className="text-gray-500 text-sm">{selectedLeave.designation}</p>
                  <p className="text-gray-400 text-xs">{selectedLeave.employeeCode}</p>
                </div>
                <Badge className={`${STATUS_COLORS[selectedLeave.statusName]}`}>
                  {selectedLeave.statusName}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Leave Type</p>
                  <p className="font-medium">{selectedLeave.leaveType}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Duration</p>
                  <p className="font-medium">{selectedLeave.numberOfDays} days</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">From Date</p>
                  <p className="font-medium">{formatDate(selectedLeave.fromDate)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">To Date</p>
                  <p className="font-medium">{formatDate(selectedLeave.toDate)}</p>
                </div>
                <div className="col-span-2 space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Reason</p>
                  <p className="font-medium text-sm">{selectedLeave.description || '-'}</p>
                </div>
                {selectedLeave.fileUpload && (
                  <div className="col-span-2 space-y-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Supporting Document</p>
                    <a
                      href={selectedLeave.fileUpload}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      <Paperclip className="w-4 h-4" />
                      View Document
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {selectedLeave.reasonOfCancellation && (
                  <div className="col-span-2 space-y-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Cancellation Reason</p>
                    <p className="font-medium text-sm text-orange-600">{selectedLeave.reasonOfCancellation}</p>
                  </div>
                )}
                <div className="col-span-2 space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Applied On</p>
                  <p className="font-medium">{formatDate(selectedLeave.createdAt)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Modal */}
      <Dialog open={approvalModalOpen} onOpenChange={setApprovalModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve or Reject Leave</DialogTitle>
            <DialogDescription>Review and take action on this leave application</DialogDescription>
          </DialogHeader>
          {selectedLeave && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="font-medium">{selectedLeave.employeeName}</p>
                <p className="text-sm text-gray-500">{selectedLeave.leaveType} • {selectedLeave.numberOfDays} days</p>
                <p className="text-sm text-gray-500">{formatDate(selectedLeave.fromDate)} - {formatDate(selectedLeave.toDate)}</p>
              </div>
              {selectedLeave.description && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Reason:</p>
                  <p className="text-sm">{selectedLeave.description}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Comment (Optional)</Label>
                <Textarea
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder="Add a comment for the employee..."
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setApprovalModalOpen(false); setApprovalComment(''); }}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleApproveReject('reject')} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4 mr-2" />Reject</>}
            </Button>
            <Button onClick={() => handleApproveReject('approve')} disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-2" />Approve</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Cancellation Modal */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Leave Cancellation</DialogTitle>
            <DialogDescription>Submit a cancellation request for your approved leave</DialogDescription>
          </DialogHeader>
          {selectedLeave && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="font-medium">{selectedLeave.leaveType}</p>
                <p className="text-sm text-gray-500">{selectedLeave.numberOfDays} days</p>
                <p className="text-sm text-gray-500">{formatDate(selectedLeave.fromDate)} - {formatDate(selectedLeave.toDate)}</p>
              </div>
              <div className="space-y-2">
                <Label>Reason for Cancellation <span className="text-red-500">*</span></Label>
                <Textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a reason for cancellation..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCancelModalOpen(false); setCancelReason(''); }}>Cancel</Button>
            <Button onClick={handleRequestCancellation} disabled={saving || !cancelReason} className="bg-orange-600 hover:bg-orange-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}

// Wrap in Suspense for useSearchParams
export default function LeavePage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
        </div>
      </MainLayout>
    }>
      <LeavePageContent />
    </Suspense>
  )
}
