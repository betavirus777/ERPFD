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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Loader2, Search, MoreHorizontal, CheckCircle, XCircle, Clock, FileText, Eye } from 'lucide-react'

const statusOptions = ['Pending', 'In Progress', 'Completed', 'Rejected']

export default function ManageDocumentRequestsPage() {
    const [loading, setLoading] = useState(true)
    const [requests, setRequests] = useState<any[]>([])
    const [search, setSearch] = useState('')
    const [selectedRequest, setSelectedRequest] = useState<any>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        status: '',
        admin_comment: ''
    })
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
    const [success, setSuccess] = useState('')

    useEffect(() => {
        fetchRequests()
    }, [])

    const fetchRequests = async () => {
        try {
            setLoading(true)
            const response = await documentRequestsAPI.getAll('admin')
            if (response?.success) {
                setRequests(response.data || [])
            }
        } catch (err) {
            console.error('Failed to fetch requests:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenUpdate = (req: any) => {
        setSelectedRequest(req)
        setFormData({
            status: req.status || 'Pending',
            admin_comment: req.admin_comment || ''
        })
        setDialogOpen(true)
    }

    const handleUpdate = async () => {
        if (!selectedRequest) return

        try {
            setSubmitting(true)

            let payload: any = formData;

            if (selectedFiles && selectedFiles.length > 0) {
                const fd = new FormData()
                fd.append('status', formData.status)
                fd.append('admin_comment', formData.admin_comment)
                Array.from(selectedFiles).forEach((file) => {
                    fd.append('files', file)
                })
                payload = fd
            }

            const response = await documentRequestsAPI.update(selectedRequest.id, payload)
            if (response?.success) {
                setSuccess('Request updated successfully!')
                setDialogOpen(false)
                setSelectedRequest(null)
                setSelectedFiles(null)
                setFormData({ status: '', admin_comment: '' })
                fetchRequests()
                setTimeout(() => setSuccess(''), 3000)
            }
        } catch (err) {
            console.error('Failed to update:', err)
        } finally {
            setSubmitting(false)
        }
    }

    const filteredRequests = requests.filter(req =>
        req.employee?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        req.employee?.last_name?.toLowerCase().includes(search.toLowerCase()) ||
        req.document_type?.toLowerCase().includes(search.toLowerCase()) ||
        req.employee?.employee_code?.toLowerCase().includes(search.toLowerCase())
    )

    const getStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
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
                        <h1 className="text-2xl font-bold tracking-tight">Manage Document Requests</h1>
                        <p className="text-gray-500">Process employee document requests</p>
                    </div>
                </div>

                {success && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 text-sm">
                        {success}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search by employee or document..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Requests</CardTitle>
                        <CardDescription>View and process document requests from employees</CardDescription>
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
                                            <TableHead>Employee</TableHead>
                                            <TableHead>Document Type</TableHead>
                                            <TableHead>Reason</TableHead>
                                            <TableHead>Requested On</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Attachments</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredRequests.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                                                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                                    <p>No document requests found</p>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredRequests.map((req) => (
                                                <TableRow key={req.id}>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{req.employee?.first_name} {req.employee?.last_name}</div>
                                                            <div className="text-xs text-gray-500">{req.employee?.employee_code}</div>
                                                        </div>
                                                    </TableCell>
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
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreHorizontal className="w-4 h-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => handleOpenUpdate(req)}>
                                                                    <Eye className="w-4 h-4 mr-2" />
                                                                    View / Update
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
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

            {/* Update Request Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Update Request</DialogTitle>
                        <DialogDescription>
                            Update the status and add comments for this document request.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Employee:</span>
                                    <p className="font-medium">{selectedRequest.employee?.first_name} {selectedRequest.employee?.last_name}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Document:</span>
                                    <p className="font-medium">{selectedRequest.document_type}</p>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-gray-500">Reason:</span>
                                    <p className="font-medium">{selectedRequest.reason || 'Not specified'}</p>
                                </div>
                            </div>
                            <hr />
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statusOptions.map(status => (
                                            <SelectItem key={status} value={status}>{status}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Admin Comments</Label>
                                <Textarea
                                    value={formData.admin_comment}
                                    onChange={(e) => setFormData(prev => ({ ...prev, admin_comment: e.target.value }))}
                                    placeholder="Add any notes for the employee..."
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Upload Documents</Label>
                                <Input
                                    type="file"
                                    multiple
                                    className="cursor-pointer"
                                    onChange={(e) => setSelectedFiles(e.target.files)}
                                />
                                <p className="text-xs text-gray-500">Select multiple files if needed.</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdate} disabled={submitting} className="bg-[#1e3a5f]">
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Request'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MainLayout>
    )
}
