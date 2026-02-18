"use client"

import React, { useEffect, useState, useCallback } from 'react'
import { ColumnDef } from "@tanstack/react-table"
import { MainLayout } from '@/components/layout/MainLayout'
import { DataTable, DataTableColumnHeader, FilterConfig } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { employeesAPI, mastersAPI } from '@/lib/api'
import {
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Users,
  UserCheck,
  UserX,
  Loader2,
  Grid,
  List,
  Mail,
  Briefcase,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from "@/lib/utils"
import { usePermission } from '@/hooks/usePermission'

interface Employee {
  id: number
  uid: string
  employeeCode: string
  employeePhoto: string | null
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  doj: string
  status: boolean
  createdAt: string
  designationId?: number
  designationName?: string
  roleId?: number
  roleName?: string
  statusName?: string
  visaType?: string
  employee_onboard_document?: {
    id: number
    end_date: string | null
    employee_document_master: {
      document_type_name: string
    }
  }[]
}

interface MasterOption {
  id: number
  name: string
}

export default function EmployeesPage() {
  const router = useRouter()
  const { can, PERMISSIONS } = usePermission()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalActive, setTotalActive] = useState(0)
  const [totalInactive, setTotalInactive] = useState(0)

  const [search, setSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')

  // Master data for filters
  const [designations, setDesignations] = useState<MasterOption[]>([])
  const [roles, setRoles] = useState<MasterOption[]>([])
  const [visaLocations, setVisaLocations] = useState<MasterOption[]>([])

  // Fetch master data for filters
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [designationsRes, rolesRes, statesRes] = await Promise.all([
          mastersAPI.getDesignations(),
          mastersAPI.getRoles(),
          fetch('/api/masters/states?country_name=United Arab Emirates').then(res => res.json())
        ])
        if (designationsRes?.data) {
          setDesignations(designationsRes.data.map((d: any) => ({
            id: d.id,
            name: d.designationName || d.designation_name
          })))
        }
        if (rolesRes?.data) {
          setRoles(rolesRes.data.map((r: any) => ({
            id: r.id,
            name: r.roleName || r.role_name
          })))
        }
        if (statesRes?.data) {
          setVisaLocations(statesRes.data.map((s: any) => ({
            id: s.id,
            name: s.name
          })))
        }
      } catch (error) {
        console.error('Failed to fetch master data:', error)
      }
    }
    fetchMasterData()
  }, [])

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true)
      const params: any = { page, limit }

      // Add search parameter
      if (search) params.search = search

      // Add all active filters to params
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value) {
          params[key] = value
        }
      })

      console.log('Fetching employees with params:', params) // Debug log

      const response = await employeesAPI.getAll(params)
      if (response?.data) {
        setEmployees(response.data)
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages)
          setTotal(response.pagination.total)
        }
        if (response.meta) {
          setTotalActive(response.meta.totalActive)
          setTotalInactive(response.meta.totalInactive)
        } else {
          setTotalActive(0)
          setTotalInactive(0)
        }
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, activeFilters])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleFilterChange = (filters: Record<string, string>) => {
    console.log('Filter changed:', filters) // Debug log
    setActiveFilters(filters)
    setPage(1)
  }

  const handleDelete = async () => {
    if (!selectedEmployee) return

    try {
      setDeleting(true)
      await employeesAPI.delete(selectedEmployee.id)
      setDeleteDialogOpen(false)
      setSelectedEmployee(null)
      fetchEmployees()
    } catch (error) {
      console.error('Failed to delete employee:', error)
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Filter configurations
  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' },
      ],
    },
    {
      key: 'role_id',
      label: 'Role',
      options: roles.map(r => ({ label: r.name, value: String(r.id) })),
    },
    {
      key: 'designation_id',
      label: 'Designation',
      options: designations.map(d => ({ label: d.name, value: String(d.id) })),
    },
    {
      key: 'visa_type',
      label: 'Visa Location',
      options: visaLocations.length > 0 ? visaLocations.map(v => ({ label: v.name, value: v.name })) : [
        { label: 'Dubai', value: 'Dubai' },
        { label: 'Abu Dhabi', value: 'Abu Dhabi' },
        { label: 'Sharjah', value: 'Sharjah' },
        { label: 'Ajman', value: 'Ajman' },
        { label: 'Umm Al Quwain', value: 'Umm Al Quwain' },
        { label: 'Ras Al Khaimah', value: 'Ras Al Khaimah' },
        { label: 'Fujairah', value: 'Fujairah' },
      ]
    }
  ]

  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: "employeeCode",
      header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-500 font-medium">
          {row.getValue("employeeCode") || '-'}
        </span>
      ),
    },
    {
      accessorKey: "firstName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Employee" />,
      cell: ({ row }) => {
        const employee = row.original
        const initials = `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-slate-200">
              {employee.employeePhoto ? (
                <AvatarImage
                  src={`${process.env.NEXT_PUBLIC_STORAGE_URL || ''}/${employee.employeePhoto}`}
                  alt={`${employee.firstName} ${employee.lastName}`}
                />
              ) : null}
              <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm text-slate-900 dark:text-white">
                {employee.firstName} {employee.lastName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{employee.email}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "designationName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Designation" />,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
            {row.getValue("designationName") || '-'}
          </span>
          <span className="text-xs text-slate-400">
            {row.original.roleName || 'Employee'}
          </span>
        </div>
      ),
    },
    {
      id: "visaType",
      accessorKey: "visaType",
      header: "Visa Location",
      cell: ({ row }) => {
        return <span className="text-sm text-slate-700">{row.original.visaType || '-'}</span>
      }
    },
    {
      accessorKey: "doj",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Joined" />,
      cell: ({ row }) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {formatDate(row.getValue("doj"))}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => {
        const status = row.getValue("status")
        return (
          <Badge variant="outline" className={status
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
            : "border-red-200 bg-red-50 text-red-700 hover:bg-red-50"
          }>
            <div className={cn("w-1.5 h-1.5 rounded-full mr-2", status ? "bg-emerald-500" : "bg-red-500")} />
            {status ? 'Active' : 'Inactive'}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const employee = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push(`/employees/${employee.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {can(PERMISSIONS.EMPLOYEE_EDIT) && (
                <DropdownMenuItem onClick={() => router.push(`/employees/${employee.id}/edit`)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {can(PERMISSIONS.EMPLOYEE_DELETE) && (
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => {
                    setSelectedEmployee(employee)
                    setDeleteDialogOpen(true)
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Employees</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Manage your organization's workforce and directories
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-8 px-2", viewMode === 'table' && "bg-white dark:bg-slate-700 shadow-sm")}
                onClick={() => setViewMode('table')}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-8 px-2", viewMode === 'card' && "bg-white dark:bg-slate-700 shadow-sm")}
                onClick={() => setViewMode('card')}
              >
                <Grid className="w-4 h-4" />
              </Button>
            </div>
            {can(PERMISSIONS.EMPLOYEE_CREATE) && (
              <Link href="/employees/new">
                <Button size="sm" className="bg-[#1e3a5f] hover:bg-[#163050] text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Employee
                </Button>
              </Link>
            )}
            {can(PERMISSIONS.REPORTS_EXPORT) && (
              <Link href="/employees/export">
                <Button size="sm" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalActive + totalInactive}</p>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Employees</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalActive}</p>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Employees</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                <UserX className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalInactive}</p>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Inactive Employees</p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table / Card View */}
        {viewMode === 'table' ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <DataTable
              columns={columns}
              data={employees}
              searchKey="firstName"
              searchPlaceholder="Search by name, ID, or email..."
              isLoading={loading}
              serverSide={true}
              totalItems={total}
              currentPage={page}
              pageSize={limit}
              onPageChange={setPage}
              onPageSizeChange={setLimit}
              onSearch={handleSearch}
              filters={filterConfigs}
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
              onRowClick={(employee) => router.push(`/employees/${employee.id}`)}
              debounceMs={1000}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                ))
              ) : employees.length === 0 ? (
                <div className="col-span-full py-12 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No employees found matching your criteria</p>
                </div>
              ) : (
                employees.map((employee) => {
                  const initials = `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`

                  return (
                    <div
                      key={employee.uid}
                      className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all p-5 cursor-pointer"
                      onClick={() => router.push(`/employees/${employee.id}`)}
                    >
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" className="h-8 w-8 p-0 bg-white/50 backdrop-blur-sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/employees/${employee.id}`); }}>View</DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/employees/${employee.id}/edit`); }}>Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); setSelectedEmployee(employee); setDeleteDialogOpen(true); }}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex flex-col items-center">
                        <Avatar className="w-20 h-20 mb-4 border-4 border-slate-50 shadow-sm">
                          <AvatarImage src={employee.employeePhoto || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-[#1e3a5f] to-[#3b6ea5] text-white text-xl font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>

                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-1">
                          {employee.firstName} {employee.lastName}
                        </h3>
                        <div className="flex items-center gap-2 mb-4">
                          <Badge variant="secondary" className="font-normal text-xs bg-slate-100 text-slate-600">
                            {employee.employeeCode}
                          </Badge>
                          <Badge className={employee.status ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                            {employee.status ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>

                        <div className="w-full space-y-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                            <Briefcase className="w-4 h-4 text-slate-400" />
                            <span className="truncate flex-1" title={employee.designationName}>{employee.designationName || 'No designation'}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                            <Mail className="w-4 h-4 text-slate-400" />
                            <span className="truncate flex-1" title={employee.email}>{employee.email}</span>
                          </div>
                          {employee.visaType && (
                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                              <FileText className="w-4 h-4 text-slate-400" />
                              <span className="truncate flex-1">
                                {employee.visaType}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Pagination Controls for Card View */}
            {!loading && employees.length > 0 && (
              <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>Previous</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>Next</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Employee</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedEmployee?.firstName} {selectedEmployee?.lastName}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}