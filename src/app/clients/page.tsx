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
import { clientsAPI } from '@/lib/api'
import {
  Plus,
  Download,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Building2,
  Globe,
  Phone,
  Mail,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'

interface Client {
  id: number
  clientId: string
  clientName: string
  clientWebsite?: string
  contactNumber?: string
  status: boolean
  countryName?: string
  contactPerson?: string
  contactEmail?: string
  createdAt?: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  
  // Form states
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add')
  const [formLoading, setFormLoading] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState({
    client_name: '',
    client_website: '',
    contact_number: '',
    client_work_address: '',
  })
  
  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true)
      const params: any = { page, limit: 10 }
      if (search) params.search = search

      const response = await clientsAPI.getAll(params)
      if (response?.data) {
        setClients(response.data)
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages)
          setTotal(response.pagination.total)
        }
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const openAddForm = () => {
    setFormMode('add')
    setFormData({ client_name: '', client_website: '', contact_number: '', client_work_address: '' })
    setSelectedClient(null)
    setFormOpen(true)
  }

  const openEditForm = (client: Client) => {
    setFormMode('edit')
    setFormData({
      client_name: client.clientName || '',
      client_website: client.clientWebsite || '',
      contact_number: client.contactNumber || '',
      client_work_address: '',
    })
    setSelectedClient(client)
    setFormOpen(true)
  }

  const handleSubmit = async () => {
    try {
      setFormLoading(true)
      if (formMode === 'add') {
        await clientsAPI.create(formData)
      } else if (selectedClient) {
        await clientsAPI.update(selectedClient.id, formData)
      }
      setFormOpen(false)
      fetchClients()
    } catch (error) {
      console.error('Failed to save client:', error)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedClient) return
    
    try {
      setDeleting(true)
      await clientsAPI.delete(selectedClient.id)
      setDeleteDialogOpen(false)
      setSelectedClient(null)
      fetchClients()
    } catch (error) {
      console.error('Failed to delete client:', error)
    } finally {
      setDeleting(false)
    }
  }

  const activeCount = clients.filter(c => c.status).length

  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: "clientId",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Client ID" />,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-[#1e3a5f] dark:text-blue-400">
          {row.getValue("clientId") || '-'}
        </span>
      ),
    },
    {
      accessorKey: "clientName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Client Name" />,
      cell: ({ row }) => {
        const client = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#1e3a5f] to-[#2d5a87] flex items-center justify-center text-white text-sm font-medium">
              {client.clientName?.[0]?.toUpperCase() || 'C'}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{client.clientName}</p>
              {client.clientWebsite && (
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {client.clientWebsite}
                </p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "contactPerson",
      header: "Contact Person",
      cell: ({ row }) => {
        const client = row.original
        return (
          <div>
            <p className="text-gray-900 dark:text-white">{client.contactPerson || '-'}</p>
            {client.contactEmail && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{client.contactEmail}</p>
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
      accessorKey: "countryName",
      header: "Location",
      cell: ({ row }) => (
        <span className="text-gray-600 dark:text-gray-400">
          {row.getValue("countryName") || '-'}
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
        const client = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => window.location.href = `/clients/${client.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEditForm(client)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600 focus:text-red-600"
                onClick={() => {
                  setSelectedClient(client)
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
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Clients</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Manage your client relationships
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="text-gray-600 dark:text-gray-300">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button size="sm" className="bg-[#1e3a5f] hover:bg-[#163050] text-white" onClick={openAddForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Clients</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeCount}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Clients</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/30">
                <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{total - activeCount}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Inactive Clients</p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
          <DataTable
            columns={columns}
            data={clients}
            searchPlaceholder="Search clients..."
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
            <SheetTitle>{formMode === 'add' ? 'Add New Client' : 'Edit Client'}</SheetTitle>
            <SheetDescription>
              {formMode === 'add' ? 'Add a new client to your organization' : 'Update client information'}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-6">
            <div className="space-y-2">
              <Label htmlFor="client_name">Client Name *</Label>
              <Input
                id="client_name"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                placeholder="Enter client name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_website">Website</Label>
              <Input
                id="client_website"
                value={formData.client_website}
                onChange={(e) => setFormData({ ...formData, client_website: e.target.value })}
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
              <Label htmlFor="client_work_address">Address</Label>
              <Input
                id="client_work_address"
                value={formData.client_work_address}
                onChange={(e) => setFormData({ ...formData, client_work_address: e.target.value })}
                placeholder="Enter address"
              />
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={formLoading || !formData.client_name} className="bg-[#1e3a5f] hover:bg-[#163050]">
              {formLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                formMode === 'add' ? 'Add Client' : 'Save Changes'
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedClient?.clientName}"? 
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
