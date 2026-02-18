"use client"

import React, { useEffect, useState, useCallback } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import axios from 'axios'
import { 
  Receipt, Search, MoreHorizontal, Pencil, Trash2, Eye, Plus, 
  Loader2, RefreshCw, DollarSign, Building2, AlertCircle, CheckCircle, FileText, Send
} from 'lucide-react'
import Link from 'next/link'

interface Invoice {
  id: number
  invoiceNumber: string
  invoiceType?: string
  salesType?: string
  clientId: number
  clientName: string
  projectId?: number
  projectName?: string
  projectCode?: string
  invoiceDate: string
  currency: string
  subtotal: number
  vatAmount: number
  grandTotal: number
  discountAmount?: number
  statusId?: number
  statusName: string
  createdAt: string
}

interface Client { id: number; company_name: string }
interface Project { id: number; project_name: string }

const STATUS_COLORS: Record<string, string> = {
  'Draft': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  'Sent': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'Paid': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'Overdue': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'Cancelled': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
}

const INVOICE_TYPES = [
  { value: 'milestone', label: 'Milestone Based' },
  { value: 'timesheet', label: 'Timesheet Based' },
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'recurring', label: 'Recurring' },
]

export default function SalesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Modals
  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Form
  const [formData, setFormData] = useState({
    sales_type: 'invoice', invoice_type: 'milestone', client_id: '', project_management_id: '',
    sales_invoice_date: new Date().toISOString().split('T')[0], sales_invoice_total: '',
    invoice_vat_amount: '', invoice_grand_total: '', sales_discount_amount: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Summary stats
  const [stats, setStats] = useState({ totalAmount: 0, paid: 0, pending: 0 })

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true)
      const params: any = { page, limit: 10 }
      if (search) params.search = search
      if (clientFilter) params.client_id = clientFilter

      const response = await axios.get('/api/sales', { params })
      if (response.data?.data) {
        setInvoices(response.data.data)
        setTotalPages(response.data.pagination?.totalPages || 1)
        setTotal(response.data.pagination?.total || 0)

        // Calculate stats
        const invs = response.data.data
        const totalAmount = invs.reduce((sum: number, inv: Invoice) => sum + (inv.grandTotal || 0), 0)
        const paid = invs.filter((inv: Invoice) => inv.statusName === 'Paid').reduce((sum: number, inv: Invoice) => sum + (inv.grandTotal || 0), 0)
        const pending = totalAmount - paid
        setStats({ totalAmount, paid, pending })
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    } finally {
      setLoading(false)
    }
  }, [page, search, clientFilter])

  const fetchClients = useCallback(async () => {
    try {
      const response = await axios.get('/api/clients', { params: { limit: 100 } })
      if (response.data?.data) {
        setClients(response.data.data.map((c: any) => ({ id: c.id, company_name: c.companyName || c.company_name })))
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    }
  }, [])

  const fetchProjects = useCallback(async (clientId?: string) => {
    try {
      const params: any = { limit: 100 }
      if (clientId) params.client_id = clientId
      const response = await axios.get('/api/projects', { params })
      if (response.data?.data) {
        setProjects(response.data.data.map((p: any) => ({ id: p.id, project_name: p.projectName })))
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }, [])

  useEffect(() => { fetchInvoices() }, [fetchInvoices])
  useEffect(() => { fetchClients() }, [fetchClients])

  // Calculate grand total when subtotal or VAT changes
  useEffect(() => {
    const subtotal = parseFloat(formData.sales_invoice_total) || 0
    const vat = parseFloat(formData.invoice_vat_amount) || 0
    const discount = parseFloat(formData.sales_discount_amount) || 0
    const grand = subtotal + vat - discount
    setFormData(prev => ({ ...prev, invoice_grand_total: grand.toFixed(2) }))
  }, [formData.sales_invoice_total, formData.invoice_vat_amount, formData.sales_discount_amount])

  const handleOpenForm = async (invoice?: Invoice) => {
    if (invoice) {
      setIsEditing(true)
      setSelectedInvoice(invoice)
      // Fetch full invoice details
      try {
        const response = await axios.get(`/api/sales/${invoice.id}`)
        const inv = response.data?.data
        if (inv) {
          if (inv.clientId) fetchProjects(String(inv.clientId))
          setFormData({
            sales_type: inv.salesType || 'invoice',
            invoice_type: inv.invoiceType || 'milestone',
            client_id: inv.clientId ? String(inv.clientId) : '',
            project_management_id: inv.projectId ? String(inv.projectId) : '',
            sales_invoice_date: inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().split('T')[0] : '',
            sales_invoice_total: inv.subtotal ? String(inv.subtotal) : '',
            invoice_vat_amount: inv.vatAmount ? String(inv.vatAmount) : '',
            invoice_grand_total: inv.grandTotal ? String(inv.grandTotal) : '',
            sales_discount_amount: inv.discountAmount ? String(inv.discountAmount) : '',
          })
        }
      } catch (error) {
        console.error('Failed to fetch invoice details')
      }
    } else {
      setIsEditing(false)
      setSelectedInvoice(null)
      setFormData({
        sales_type: 'invoice', invoice_type: 'milestone', client_id: '', project_management_id: '',
        sales_invoice_date: new Date().toISOString().split('T')[0], sales_invoice_total: '',
        invoice_vat_amount: '', invoice_grand_total: '', sales_discount_amount: '',
      })
    }
    setFormOpen(true)
  }

  const handleClientChange = (clientId: string) => {
    setFormData({ ...formData, client_id: clientId, project_management_id: '' })
    if (clientId) fetchProjects(clientId)
  }

  const handleSave = async () => {
    if (!formData.client_id) {
      setError('Client is required')
      return
    }

    try {
      setSaving(true)
      setError('')

      if (isEditing && selectedInvoice) {
        await axios.put(`/api/sales/${selectedInvoice.id}`, formData)
        setSuccess('Invoice updated successfully!')
      } else {
        await axios.post('/api/sales', formData)
        setSuccess('Invoice created successfully!')
      }

      setFormOpen(false)
      fetchInvoices()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save invoice')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedInvoice) return

    try {
      await axios.delete(`/api/sales/${selectedInvoice.id}`)
      setDeleteDialogOpen(false)
      setSelectedInvoice(null)
      setSuccess('Invoice deleted successfully!')
      fetchInvoices()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete invoice')
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatCurrency = (amount: number, currency = 'AED') => {
    return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Sales & Invoices</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your invoices and track payments</p>
          </div>
          <Button onClick={() => handleOpenForm()} className="bg-[#1e3a5f] hover:bg-[#163050]">
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-red-600">&times;</button>
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Receipt className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
                  <p className="text-sm text-gray-500">Total Invoices</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalAmount)}</p>
                  <p className="text-sm text-gray-500">Total Amount</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.paid)}</p>
                  <p className="text-sm text-gray-500">Paid</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                  <Send className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.pending)}</p>
                  <p className="text-sm text-gray-500">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="Search by invoice number..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </div>
              </div>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-48"><SelectValue placeholder="All Clients" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Clients</SelectItem>
                  {clients.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => { setSearch(''); setClientFilter(''); }}>
                <RefreshCw className="w-4 h-4 mr-2" />Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Receipt className="w-16 h-16 mb-4 text-gray-300" />
                <p className="text-lg font-medium">No invoices found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                    <TableHead>Invoice</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{invoice.invoiceNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span>{invoice.clientName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {invoice.projectName ? (
                          <div>
                            <p className="text-sm">{invoice.projectName}</p>
                            <p className="text-xs text-gray-500">{invoice.projectCode}</p>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(invoice.invoiceDate)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.grandTotal, invoice.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[invoice.statusName] || 'bg-gray-100'}>
                          {invoice.statusName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/sales/${invoice.id}`}>
                                <Eye className="w-4 h-4 mr-2" />View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenForm(invoice)}>
                              <Pencil className="w-4 h-4 mr-2" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedInvoice(invoice); setDeleteDialogOpen(true); }} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Form Sheet */}
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{isEditing ? 'Edit Invoice' : 'New Invoice'}</SheetTitle>
            <SheetDescription>{isEditing ? 'Update invoice details' : 'Create a new invoice'}</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Invoice Type</Label>
                <Select value={formData.invoice_type} onValueChange={(v) => setFormData({ ...formData, invoice_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INVOICE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Invoice Date</Label>
                <Input type="date" value={formData.sales_invoice_date} onChange={(e) => setFormData({ ...formData, sales_invoice_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Client <span className="text-red-500">*</span></Label>
              <Select value={formData.client_id} onValueChange={handleClientChange}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={formData.project_management_id} onValueChange={(v) => setFormData({ ...formData, project_management_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select project (optional)" /></SelectTrigger>
                <SelectContent>
                  {projects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.project_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subtotal</Label>
                <Input type="number" step="0.01" value={formData.sales_invoice_total} onChange={(e) => setFormData({ ...formData, sales_invoice_total: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>VAT Amount</Label>
                <Input type="number" step="0.01" value={formData.invoice_vat_amount} onChange={(e) => setFormData({ ...formData, invoice_vat_amount: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount</Label>
                <Input type="number" step="0.01" value={formData.sales_discount_amount} onChange={(e) => setFormData({ ...formData, sales_discount_amount: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Grand Total</Label>
                <Input type="number" step="0.01" value={formData.invoice_grand_total} disabled className="bg-gray-50 font-bold" />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setFormOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1 bg-[#1e3a5f] hover:bg-[#163050]">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>Are you sure you want to delete {selectedInvoice?.invoiceNumber}? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
