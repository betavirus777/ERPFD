"use client"

import React, { useEffect, useState, useCallback } from 'react'
import { ColumnDef } from "@tanstack/react-table"
import { MainLayout } from '@/components/layout/MainLayout'
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { vendorsAPI } from '@/lib/api'
import {
  Plus,
  Download,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Truck,
  Globe,
  Loader2,
} from 'lucide-react'

interface Vendor {
  id: number
  serviceDeliveryId: string
  vendorName: string
  vendorWebsite?: string
  vendorType?: string
  contactNumber?: string
  workAddress?: string
  status: boolean
  countryName?: string
  contactPerson?: string
  contactEmail?: string
  contactPhone?: string
  createdAt?: string
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  
  // Form states
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add')
  const [formLoading, setFormLoading] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [formData, setFormData] = useState({
    vendor_name: '',
    vendor_website: '',
    vendor_type: '',
    contact_number: '',
    work_address: '',
  })
  
  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true)
      const params: any = { page, limit: 10 }
      if (search) params.search = search

      const response = await vendorsAPI.getAll(params)
      if (response?.data) {
        setVendors(response.data)
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages)
          setTotal(response.pagination.total)
        }
      }
    } catch (error) {
      console.error('Failed to fetch vendors:', error)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const openAddForm = () => {
    setFormMode('add')
    setFormData({ vendor_name: '', vendor_website: '', vendor_type: '', contact_number: '', work_address: '' })
    setSelectedVendor(null)
    setFormOpen(true)
  }

  const openEditForm = (vendor: Vendor) => {
    setFormMode('edit')
    setFormData({
      vendor_name: vendor.vendorName || '',
      vendor_website: vendor.vendorWebsite || '',
      vendor_type: vendor.vendorType || '',
      contact_number: vendor.contactNumber || '',
      work_address: vendor.workAddress || '',
    })
    setSelectedVendor(vendor)
    setFormOpen(true)
  }

  const handleSubmit = async () => {
    try {
      setFormLoading(true)
      if (formMode === 'add') {
        await vendorsAPI.create(formData)
      } else if (selectedVendor) {
        await vendorsAPI.update(selectedVendor.id, formData)
      }
      setFormOpen(false)
      fetchVendors()
    } catch (error) {
      console.error('Failed to save vendor:', error)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedVendor) return
    
    try {
      setDeleting(true)
      await vendorsAPI.delete(selectedVendor.id)
      setDeleteDialogOpen(false)
      setSelectedVendor(null)
      fetchVendors()
    } catch (error) {
      console.error('Failed to delete vendor:', error)
    } finally {
      setDeleting(false)
    }
  }

  const activeCount = vendors.filter(v => v.status).length

  const columns: ColumnDef<Vendor>[] = [
    {
      accessorKey: "serviceDeliveryId",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Vendor ID" />,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-[#1e3a5f] dark:text-blue-400">
          {row.getValue("serviceDeliveryId") || '-'}
        </span>
      ),
    },
    {
      accessorKey: "vendorName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Vendor Name" />,
      cell: ({ row }) => {
        const vendor = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-sm font-medium">
              {vendor.vendorName?.[0]?.toUpperCase() || 'V'}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{vendor.vendorName}</p>
              {vendor.vendorWebsite && (
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {vendor.vendorWebsite}
                </p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "vendorType",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("vendorType") as string
        return type ? (
          <Badge variant="outline" className="capitalize">
            {type}
          </Badge>
        ) : '-'
      },
    },
    {
      accessorKey: "contactPerson",
      header: "Contact Person",
      cell: ({ row }) => {
        const vendor = row.original
        return (
          <div>
            <p className="text-gray-900 dark:text-white">{vendor.contactPerson || '-'}</p>
            {vendor.contactEmail && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{vendor.contactEmail}</p>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "contactNumber",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-gray-600 dark:text-gray-400">
          {row.getValue("contactNumber") || '-'}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status")
        return (
          <Badge className={status 
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100" 
            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100"
          }>
            {status ? 'Active' : 'Inactive'}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const vendor = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => window.location.href = `/vendors/${vendor.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEditForm(vendor)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600 focus:text-red-600"
                onClick={() => {
                  setSelectedVendor(vendor)
                  setDeleteDialogOpen(true)
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Vendors</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Manage your service delivery partners
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="text-gray-600 dark:text-gray-300">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button size="sm" className="bg-[#1e3a5f] hover:bg-[#163050] text-white" onClick={openAddForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Vendor
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/30">
                <Truck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Vendors</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                <Truck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeCount}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Vendors</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/30">
                <Truck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{total - activeCount}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Inactive Vendors</p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
          <DataTable
            columns={columns}
            data={vendors}
            searchPlaceholder="Search vendors..."
            isLoading={loading}
            serverSide={true}
            totalItems={total}
            currentPage={page}
            onPageChange={setPage}
            onSearch={handleSearch}
          />
        </div>
      </div>

      {/* Add/Edit Sheet */}
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{formMode === 'add' ? 'Add New Vendor' : 'Edit Vendor'}</SheetTitle>
            <SheetDescription>
              {formMode === 'add' ? 'Add a new vendor to your organization' : 'Update vendor information'}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-6">
            <div className="space-y-2">
              <Label htmlFor="vendor_name">Vendor Name *</Label>
              <Input
                id="vendor_name"
                value={formData.vendor_name}
                onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                placeholder="Enter vendor name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor_type">Vendor Type</Label>
              <Select value={formData.vendor_type} onValueChange={(value) => setFormData({ ...formData, vendor_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Consulting">Consulting</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Services">Services</SelectItem>
                  <SelectItem value="Supplier">Supplier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor_website">Website</Label>
              <Input
                id="vendor_website"
                value={formData.vendor_website}
                onChange={(e) => setFormData({ ...formData, vendor_website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_number">Contact Number</Label>
              <Input
                id="contact_number"
                value={formData.contact_number}
                onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                placeholder="+1 234 567 8900"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="work_address">Address</Label>
              <Input
                id="work_address"
                value={formData.work_address}
                onChange={(e) => setFormData({ ...formData, work_address: e.target.value })}
                placeholder="Enter address"
              />
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={formLoading || !formData.vendor_name} className="bg-[#1e3a5f] hover:bg-[#163050]">
              {formLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                formMode === 'add' ? 'Add Vendor' : 'Save Changes'
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Vendor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedVendor?.vendorName}"? 
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
