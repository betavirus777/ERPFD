"use client"

import React, { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { salesAPI, clientsAPI, projectsAPI, mastersAPI } from '@/lib/api'
import { ArrowLeft, Save, Loader2, Plus, Trash2, FileText, DollarSign, Building2 } from 'lucide-react'

interface InvoiceItem {
  id?: number
  description: string
  quantity: number
  rate: number
  amount: number
}

interface FormData {
  invoiceNumber: string
  clientId: string
  projectId: string
  invoiceDate: string
  dueDate: string
  currency: string
  statusId: string
  notes: string
  items: InvoiceItem[]
}

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const [clients, setClients] = useState<Array<{ id: number; clientName: string }>>([])
  const [projects, setProjects] = useState<Array<{ id: number; projectName: string }>>([])
  const [statuses, setStatuses] = useState<Array<{ id: number; statusName: string }>>([])
  
  const [formData, setFormData] = useState<FormData>({
    invoiceNumber: '',
    clientId: '',
    projectId: '',
    invoiceDate: '',
    dueDate: '',
    currency: 'USD',
    statusId: '',
    notes: '',
    items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invoiceRes, clientsRes, projectsRes, statusesRes] = await Promise.all([
          salesAPI.getById(parseInt(id)),
          clientsAPI.getAll({ limit: 1000 }),
          projectsAPI.getAll({ limit: 1000 }),
          mastersAPI.getStatuses('invoices'),
        ])

        if (invoiceRes?.data) {
          const inv = invoiceRes.data
          setFormData({
            invoiceNumber: inv.invoiceNumber || '',
            clientId: inv.clientId?.toString() || '',
            projectId: inv.projectId?.toString() || '',
            invoiceDate: inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().split('T')[0] : '',
            dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
            currency: inv.currency || 'USD',
            statusId: inv.statusId?.toString() || '',
            notes: inv.notes || '',
            items: inv.items?.length > 0 ? inv.items : [{ description: '', quantity: 1, rate: 0, amount: 0 }],
          })
        }

        if (clientsRes?.data) setClients(clientsRes.data)
        if (projectsRes?.data) setProjects(projectsRes.data)
        if (statusesRes?.data) setStatuses(statusesRes.data)
      } catch (error) {
        console.error('Failed to fetch data:', error)
        setError('Failed to load invoice data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.clientId) {
      setError('Client is required')
      return
    }

    try {
      setSaving(true)
      
      const subTotal = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0)
      const taxAmount = 0 // Could be calculated based on tax rate
      const totalAmount = subTotal + taxAmount

      const response = await salesAPI.update(parseInt(id), {
        ...formData,
        clientId: formData.clientId ? parseInt(formData.clientId) : null,
        projectId: formData.projectId ? parseInt(formData.projectId) : null,
        statusId: formData.statusId ? parseInt(formData.statusId) : null,
        subTotal,
        taxAmount,
        totalAmount,
      })

      if (response?.success) {
        router.push(`/sales/${id}`)
      } else {
        setError(response?.error || 'Failed to update invoice')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to update invoice')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...formData.items]
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    }
    
    // Auto-calculate amount
    if (field === 'quantity' || field === 'rate') {
      const qty = field === 'quantity' ? value : updatedItems[index].quantity
      const rate = field === 'rate' ? value : updatedItems[index].rate
      updatedItems[index].amount = qty * rate
    }
    
    setFormData(prev => ({ ...prev, items: updatedItems }))
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, rate: 0, amount: 0 }],
    }))
  }

  const removeItem = (index: number) => {
    if (formData.items.length === 1) return
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const calculateTotals = () => {
    const subTotal = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0)
    const taxAmount = 0
    const totalAmount = subTotal + taxAmount
    return { subTotal, taxAmount, totalAmount }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: formData.currency,
    }).format(amount || 0)
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
        </div>
      </MainLayout>
    )
  }

  const totals = calculateTotals()

  return (
    <MainLayout>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="icon" onClick={() => router.push(`/sales/${id}`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Edit Invoice
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {formData.invoiceNumber}
            </p>
          </div>
          <Button type="submit" disabled={saving} className="bg-[#1e3a5f] hover:bg-[#163050]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client & Project */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Client & Project
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client <span className="text-red-500">*</span></Label>
                  <Select value={formData.clientId} onValueChange={(v) => handleChange('clientId', v)}>
                    <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent>
                      {clients.map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.clientName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Project</Label>
                  <Select value={formData.projectId} onValueChange={(v) => handleChange('projectId', v)}>
                    <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">None</SelectItem>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.projectName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Invoice Number</Label>
                <Input value={formData.invoiceNumber} disabled className="bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Label>Invoice Date</Label>
                <Input
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => handleChange('invoiceDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleChange('dueDate', e.target.value)}
                  min={formData.invoiceDate}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={formData.currency} onValueChange={(v) => handleChange('currency', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="AED">AED</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.statusId} onValueChange={(v) => handleChange('statusId', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {statuses.map(s => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.statusName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Invoice Items
            </CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                  <TableHead className="w-[45%]">Description</TableHead>
                  <TableHead className="w-[15%]">Quantity</TableHead>
                  <TableHead className="w-[15%]">Rate</TableHead>
                  <TableHead className="w-[15%] text-right">Amount</TableHead>
                  <TableHead className="w-[10%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Input
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="Item description"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        disabled={formData.items.length === 1}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Totals & Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Add any notes or payment terms..."
                rows={4}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(totals.subTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax</span>
                <span className="font-medium">{formatCurrency(totals.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold pt-3 border-t">
                <span>Total</span>
                <span className="text-[#1e3a5f] dark:text-blue-400">
                  {formatCurrency(totals.totalAmount)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </MainLayout>
  )
}

