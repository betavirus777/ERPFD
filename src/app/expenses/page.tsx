"use client"

import React, { useEffect, useState, useCallback } from 'react'
import { ColumnDef } from "@tanstack/react-table"
import { MainLayout } from '@/components/layout/MainLayout'
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Download,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Receipt,
  Loader2,
  FileText,
  Upload,
} from 'lucide-react'
import Link from 'next/link'

interface Expense {
  id: number
  uid: string
  expenseDate: string
  category: string
  amount: number
  currency: string
  description: string
  receiptUrl?: string
  status: string
  submittedBy: string
  submittedByName: string
  projectName?: string
  createdAt: string
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    expenseDate: '',
    category: '',
    amount: '',
    currency: 'USD',
    description: '',
    projectId: '',
  })

  const expenseCategories = [
    'Travel',
    'Meals',
    'Accommodation',
    'Office Supplies',
    'Software/Subscriptions',
    'Client Entertainment',
    'Transportation',
    'Other',
  ]

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/expenses')
      const data = await response.json()
      if (data.success) {
        setExpenses(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const payload: any = {
        expenseDate: formData.expenseDate,
        category: formData.category,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        description: formData.description,
      }

      if (formData.projectId) payload.projectId = parseInt(formData.projectId)

      // Upload receipt if provided
      if (receiptFile) {
        const formDataObj = new FormData()
        formDataObj.append('file', receiptFile)
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formDataObj,
        })
        const uploadData = await uploadRes.json()
        if (uploadData.success) {
          payload.receiptUrl = uploadData.path
        }
      }

      const url = selectedExpense
        ? `/api/expenses/${selectedExpense.uid}`
        : '/api/expenses'
      
      const response = await fetch(url, {
        method: selectedExpense ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      
      if (data.success) {
        setDialogOpen(false)
        resetForm()
        fetchExpenses()
      }
    } catch (error) {
      console.error('Failed to save expense:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedExpense) return

    try {
      setLoading(true)
      const response = await fetch(`/api/expenses/${selectedExpense.uid}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      
      if (data.success) {
        setDeleteDialogOpen(false)
        setSelectedExpense(null)
        fetchExpenses()
      }
    } catch (error) {
      console.error('Failed to delete expense:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      expenseDate: '',
      category: '',
      amount: '',
      currency: 'USD',
      description: '',
      projectId: '',
    })
    setSelectedExpense(null)
    setReceiptFile(null)
  }

  const openEditDialog = (expense: Expense) => {
    setSelectedExpense(expense)
    setFormData({
      expenseDate: expense.expenseDate,
      category: expense.category,
      amount: expense.amount.toString(),
      currency: expense.currency,
      description: expense.description,
      projectId: '',
    })
    setDialogOpen(true)
  }

  const columns: ColumnDef<Expense>[] = [
    {
      accessorKey: "expenseDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          {new Date(row.getValue("expenseDate")).toLocaleDateString()}
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="max-w-xs truncate">{row.getValue("description")}</div>
      ),
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"))
        const currency = row.original.currency
        return (
          <div className="font-semibold whitespace-nowrap">
            {currency} {amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        )
      },
    },
    {
      accessorKey: "submittedByName",
      header: "Submitted By",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const getStatusColor = () => {
          switch(status.toLowerCase()) {
            case 'approved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
            case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }
        }
        return <Badge className={getStatusColor()}>{status}</Badge>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const expense = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEditDialog(expense)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {expense.receiptUrl && (
                <DropdownMenuItem asChild>
                  <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer">
                    <Eye className="mr-2 h-4 w-4" />
                    View Receipt
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedExpense(expense)
                  setDeleteDialogOpen(true)
                }}
                className="text-red-600"
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Receipt className="w-8 h-8 text-blue-600" />
              Expense Management
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Track and manage employee expenses
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              onClick={() => {
                resetForm()
                setDialogOpen(true)
              }}
              className="bg-[#1e3a5f] hover:bg-[#2d5a87]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {expenses.length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Amount</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              ${expenses.reduce((sum, exp) => sum + exp.amount, 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
            <div className="text-2xl font-bold text-yellow-600 mt-1">
              {expenses.filter(e => e.status.toLowerCase() === 'pending').length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Approved</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {expenses.filter(e => e.status.toLowerCase() === 'approved').length}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <DataTable
            columns={columns}
            data={expenses}
            searchKey="description"
            searchPlaceholder="Search expenses..."
            isLoading={loading}
          />
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedExpense ? 'Edit' : 'Add'} Expense</DialogTitle>
            <DialogDescription>
              {selectedExpense ? 'Update' : 'Create a new'} expense record
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Expense Date</Label>
                <Input
                  type="date"
                  value={formData.expenseDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expenseDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="AED">AED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter expense description..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Receipt</Label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-gray-500">Upload receipt (images or PDF)</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}


