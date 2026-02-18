"use client"

import React, { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { salesAPI } from '@/lib/api'
import { 
  ArrowLeft, Edit, FileText, Loader2, Building2, Calendar,
  DollarSign, Printer, Download, Send
} from 'lucide-react'

interface Invoice {
  id: number
  invoiceNumber: string
  clientId: number
  clientName: string
  projectId: number
  projectName: string
  invoiceDate: string
  dueDate: string
  subTotal: number
  taxAmount: number
  totalAmount: number
  currency: string
  statusId: number
  statusName: string
  notes: string
  items: Array<{
    id: number
    description: string
    quantity: number
    rate: number
    amount: number
  }>
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  'Draft': 'bg-gray-100 text-gray-800',
  'Sent': 'bg-blue-100 text-blue-800',
  'Paid': 'bg-green-100 text-green-800',
  'Overdue': 'bg-red-100 text-red-800',
  'Cancelled': 'bg-red-100 text-red-800',
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await salesAPI.getById(parseInt(id))
        if (response?.data) {
          setInvoice(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch invoice:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInvoice()
  }, [id])

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
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

  if (!invoice) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <p className="text-lg text-gray-500">Invoice not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/sales')}>
            Back to Invoices
          </Button>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/sales')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Invoice {invoice.invoiceNumber}
              </h1>
              <Badge className={STATUS_COLORS[invoice.statusName] || 'bg-gray-100'}>
                {invoice.statusName}
              </Badge>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Created on {formatDate(invoice.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            {invoice.statusName === 'Draft' && (
              <Button variant="outline" size="sm">
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            )}
            <Button onClick={() => router.push(`/sales/${id}/edit`)} className="bg-[#1e3a5f] hover:bg-[#163050]">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client & Project Info */}
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Bill To</h3>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <Building2 className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{invoice.clientName}</p>
                      <p className="text-gray-500 text-sm">Client</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Project</h3>
                  <p className="font-medium">{invoice.projectName || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Summary */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Invoice Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoice Date</span>
                  <span className="font-medium">{formatDate(invoice.invoiceDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Due Date</span>
                  <span className="font-medium">{formatDate(invoice.dueDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Currency</span>
                  <span className="font-medium">{invoice.currency}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invoice Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                  <TableHead className="w-[50%]">Description</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, index) => (
                    <TableRow key={item.id || index}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.rate, invoice.currency)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.amount, invoice.currency)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                      No items added
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-end">
              <div className="w-80 space-y-3">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(invoice.subTotal, invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Tax</span>
                  <span>{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-3 border-t">
                  <span>Total</span>
                  <span className="text-[#1e3a5f] dark:text-blue-400">
                    {formatCurrency(invoice.totalAmount, invoice.currency)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {invoice.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {invoice.notes}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}

