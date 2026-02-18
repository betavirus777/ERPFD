"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Search,
  Loader2,
  Calendar,
  User,
  Activity,
  Eye,
  Filter,
  RefreshCw,
  FileText,
  Edit,
  Trash,
  Plus,
  LogIn,
  LogOut,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface AuditLog {
  id: number
  userId: number
  userName: string
  userEmail: string
  action: string
  module: string
  description: string
  ipAddress: string
  userAgent: string
  oldData?: any
  newData?: any
  createdAt: string
}

const ACTION_COLORS: Record<string, string> = {
  'CREATE': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'UPDATE': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'DELETE': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'LOGIN': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  'LOGOUT': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  'VIEW': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  'EXPORT': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
}

const ACTION_ICONS: Record<string, any> = {
  'CREATE': Plus,
  'UPDATE': Edit,
  'DELETE': Trash,
  'LOGIN': LogIn,
  'LOGOUT': LogOut,
  'VIEW': Eye,
  'EXPORT': Download,
}

const MODULES = [
  { value: '', label: 'All Modules' },
  { value: 'employees', label: 'Employees' },
  { value: 'leave', label: 'Leave Management' },
  { value: 'clients', label: 'Clients' },
  { value: 'vendors', label: 'Vendors' },
  { value: 'projects', label: 'Projects' },
  { value: 'opportunities', label: 'Opportunities' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'auth', label: 'Authentication' },
  { value: 'settings', label: 'Settings' },
]

const ACTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'VIEW', label: 'View' },
  { value: 'EXPORT', label: 'Export' },
]

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  
  // Filters
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  
  // Detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      params.append('page', String(page))
      params.append('limit', '20')
      if (search) params.append('search', search)
      if (moduleFilter) params.append('module', moduleFilter)
      if (actionFilter) params.append('action', actionFilter)
      if (fromDate) params.append('from_date', fromDate)
      if (toDate) params.append('to_date', toDate)
      
      const response = await fetch(`/api/audit-trail?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setLogs(result.data || [])
        setTotalPages(result.pagination?.totalPages || 1)
        setTotal(result.pagination?.total || 0)
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err)
    } finally {
      setLoading(false)
    }
  }, [page, search, moduleFilter, actionFilter, fromDate, toDate])

  useEffect(() => {
    fetchAuditLogs()
  }, [fetchAuditLogs])

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log)
    setDetailModalOpen(true)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const clearFilters = () => {
    setSearch('')
    setModuleFilter('')
    setActionFilter('')
    setFromDate('')
    setToDate('')
    setPage(1)
  }

  const ActionIcon = ({ action }: { action: string }) => {
    const Icon = ACTION_ICONS[action] || Activity
    return <Icon className="w-4 h-4" />
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1e3a5f] to-[#2d5a87] bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-300">
              Audit Trail
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Track all system activities and changes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchAuditLogs}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
                  <p className="text-sm text-gray-500">Total Activities</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Plus className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {logs.filter(l => l.action === 'CREATE').length}
                  </p>
                  <p className="text-sm text-gray-500">Creates</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                  <Edit className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {logs.filter(l => l.action === 'UPDATE').length}
                  </p>
                  <p className="text-sm text-gray-500">Updates</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <Trash className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {logs.filter(l => l.action === 'DELETE').length}
                  </p>
                  <p className="text-sm text-gray-500">Deletes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <CardTitle className="text-lg">Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="lg:col-span-2">
                <Label className="text-xs text-gray-500 mb-1 block">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by user, description..."
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Module</Label>
                <Select value={moduleFilter} onValueChange={setModuleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Modules" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODULES.map(m => (
                      <SelectItem key={m.value} value={m.value || "all"}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Action</Label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIONS.map(a => (
                      <SelectItem key={a.value} value={a.value || "all"}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">From Date</Label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">To Date</Label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audit Log Table */}
        <Card className="shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
            <CardTitle className="text-xl text-[#1e3a5f] dark:text-blue-400">Activity Log</CardTitle>
            <CardDescription>Showing {logs.length} of {total} activities</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No audit logs found</p>
                <p className="text-sm mt-1">Activities will appear here when actions are performed</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                    <TableHead className="font-semibold">Date & Time</TableHead>
                    <TableHead className="font-semibold">User</TableHead>
                    <TableHead className="font-semibold">Action</TableHead>
                    <TableHead className="font-semibold">Module</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold">IP Address</TableHead>
                    <TableHead className="text-right font-semibold">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(log.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center text-xs font-medium">
                            {log.userName?.substring(0, 2).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{log.userName}</p>
                            <p className="text-xs text-gray-500">{log.userEmail}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800'} gap-1`}>
                          <ActionIcon action={log.action} />
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize text-sm">{log.module}</span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-gray-600">
                        {log.description}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {log.ipAddress}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewDetails(log)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Activity Details
            </DialogTitle>
            <DialogDescription>
              Detailed information about this activity
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Date & Time</Label>
                  <p className="font-medium">{formatDate(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">User</Label>
                  <p className="font-medium">{selectedLog.userName}</p>
                  <p className="text-xs text-gray-500">{selectedLog.userEmail}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Action</Label>
                  <Badge className={ACTION_COLORS[selectedLog.action] || 'bg-gray-100'}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Module</Label>
                  <p className="font-medium capitalize">{selectedLog.module}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-gray-500">Description</Label>
                  <p className="font-medium">{selectedLog.description}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">IP Address</Label>
                  <p className="font-medium">{selectedLog.ipAddress}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">User Agent</Label>
                  <p className="font-medium text-xs truncate">{selectedLog.userAgent}</p>
                </div>
              </div>
              
              {selectedLog.oldData && (
                <div>
                  <Label className="text-xs text-gray-500">Previous Data</Label>
                  <pre className="mt-1 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.oldData, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedLog.newData && (
                <div>
                  <Label className="text-xs text-gray-500">New Data</Label>
                  <pre className="mt-1 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.newData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}

