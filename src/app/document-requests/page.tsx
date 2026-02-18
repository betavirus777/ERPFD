"use client"

import React, { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { documentRequestsAPI } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Plus, FileText, Clock, CheckCircle, XCircle } from 'lucide-react'

const documentTypes = [
  'Salary Certificate',
  'Employment Certificate',
  'Experience Letter',
  'NOC (No Objection Certificate)',
  'Bank Letter',
  'Visa Letter',
  'Other'
]

export default function DocumentRequestPage() {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<any[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    document_type: '',
    reason: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await documentRequestsAPI.getAll('user')
      if (response?.success) {
        setRequests(response.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.document_type) {
      setError('Please select a document type')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      const response = await documentRequestsAPI.create(formData)
      if (response?.success) {
        setSuccess('Document request submitted successfully!')
        setDialogOpen(false)
        setFormData({ document_type: '', reason: '' })
        fetchRequests()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(response?.error || 'Failed to submit request')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
      case 'in progress':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Document Requests</h1>
            <p className="text-gray-500">Request official documents from HR</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="bg-[#1e3a5f] hover:bg-[#163050]">
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 text-sm">
            {success}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>My Requests</CardTitle>
            <CardDescription>Track the status of your document requests</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Requested On</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Attachments</TableHead>
                      <TableHead>Admin Comments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No document requests found</p>
                          <p className="text-sm mt-1">Click "New Request" to submit one</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      requests.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell className="font-medium">{req.document_type}</TableCell>
                          <TableCell className="max-w-xs truncate">{req.reason || '-'}</TableCell>
                          <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>{getStatusBadge(req.status)}</TableCell>
                          <TableCell>
                            {req.attachments && req.attachments.length > 0 ? (
                              <div className="flex flex-col gap-1 text-xs">
                                {req.attachments.map((file: any) => (
                                  <a
                                    key={file.id}
                                    href={file.file_path.startsWith('/') ? file.file_path : `/${file.file_path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline flex items-center gap-1"
                                  >
                                    <FileText className="w-3 h-3" />
                                    {file.file_name}
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{req.admin_comment || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Request Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Document</DialogTitle>
            <DialogDescription>
              Submit a request for an official document. HR will process your request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label>Document Type <span className="text-red-500">*</span></Label>
              <Select
                value={formData.document_type}
                onValueChange={(val) => setFormData(prev => ({ ...prev, document_type: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason / Purpose</Label>
              <Textarea
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Why do you need this document?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-[#1e3a5f]">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
