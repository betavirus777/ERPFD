"use client"

import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { leaveAPI } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

interface ApplyLeaveDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    leaveTypes: any[]
    employeeUid?: string // If provided, applies for this employee (admin mode implied if different from user.id)
    isAdminMode?: boolean // If true, allows selecting employee (if not provided)
    employees?: any[] // List of employees for admin selection
}

export function ApplyLeaveDialog({
    open,
    onOpenChange,
    onSuccess,
    leaveTypes,
    employeeUid,
    isAdminMode = false,
    employees = []
}: ApplyLeaveDialogProps) {
    const { user } = useAuthStore()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const [formData, setFormData] = useState({
        targetEmployeeUid: '',
        leaveTypeId: '',
        fromDate: '',
        toDate: '',
        numberOfDays: '',
        reason: '',
        file: null as File | null
    })

    // Reset form when opening
    useEffect(() => {
        if (open) {
            setFormData({
                targetEmployeeUid: employeeUid || '',
                leaveTypeId: '',
                fromDate: '',
                toDate: '',
                numberOfDays: '',
                reason: '',
                file: null
            })
            setError('')
            setSuccess('')
        }
    }, [open, employeeUid])

    const calculateDays = (from: string, to: string) => {
        if (!from || !to) return 0
        const d1 = new Date(from)
        const d2 = new Date(to)
        const diffTime = Math.abs(d2.getTime() - d1.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
        return diffDays
    }

    useEffect(() => {
        if (formData.fromDate && formData.toDate) {
            const days = calculateDays(formData.fromDate, formData.toDate)
            setFormData(prev => ({ ...prev, numberOfDays: String(days) }))
        }
    }, [formData.fromDate, formData.toDate])

    const handleSubmit = async () => {
        // Validation
        if (!formData.leaveTypeId || !formData.fromDate || !formData.toDate || !formData.reason) {
            setError('Please fill all required fields')
            return
        }

        if (isAdminMode && !formData.targetEmployeeUid && !employeeUid) {
            setError('Please select an employee')
            return
        }

        const targetUid = isAdminMode ? (formData.targetEmployeeUid || employeeUid) : user?.id

        if (!targetUid) {
            setError('Target user not identified')
            return
        }

        try {
            setLoading(true)
            setError('')

            let fileUploadPath = undefined
            if (formData.file) {
                const uploadData = new FormData()
                uploadData.append('file', formData.file)
                uploadData.append('path', 'leave-documents')

                // Assuming fileAPI.upload exists and returns { success: true, path: '...' }
                // Based on src/lib/api.ts logic
                const uploadRes = await import('@/lib/api').then(m => m.fileAPI.upload(uploadData))
                if (uploadRes?.path) {
                    fileUploadPath = uploadRes.path
                } else if (uploadRes?.data?.path) {
                    fileUploadPath = uploadRes.data.path
                }
            }

            const payload: any = {
                leaveTypeId: parseInt(formData.leaveTypeId),
                fromDate: formData.fromDate,
                toDate: formData.toDate,
                noOfDays: parseInt(formData.numberOfDays),
                reason: formData.reason,
                fileUpload: fileUploadPath
            }

            let response
            if (isAdminMode) {
                // Admin apply
                response = await leaveAPI.adminApply({
                    ...payload,
                    employeeUid: targetUid
                })
            } else {
                // Self apply
                response = await leaveAPI.apply({
                    ...payload,
                    employeeUid: targetUid
                })
            }

            if (response?.success) {
                setSuccess('Leave applied successfully!')
                setTimeout(() => {
                    onOpenChange(false)
                    onSuccess()
                }, 1500)
            } else {
                setError(response?.error || 'Failed to apply leave')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to apply leave')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {isAdminMode ? 'Apply Leave for Employee' : 'Apply for Leave'}
                    </DialogTitle>
                    <DialogDescription>
                        Submit a new leave application
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 text-sm text-green-600 bg-green-50 rounded-lg">
                            {success}
                        </div>
                    )}

                    {isAdminMode && !employeeUid && (
                        <div className="space-y-2">
                            <Label>Employee <span className="text-red-500">*</span></Label>
                            <SearchableSelect
                                options={employees.map(e => ({ value: e.uid, label: `${e.firstName} ${e.lastName}` }))}
                                value={formData.targetEmployeeUid}
                                onChange={(val) => setFormData(prev => ({ ...prev, targetEmployeeUid: val }))}
                                placeholder="Select Employee"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Leave Type <span className="text-red-500">*</span></Label>
                        <SearchableSelect
                            options={leaveTypes.map(t => ({ value: String(t.id), label: t.leaveTypeName || t.name || t.leaveType }))}
                            value={formData.leaveTypeId}
                            onChange={(val) => setFormData(prev => ({ ...prev, leaveTypeId: val }))}
                            placeholder="Select Leave Type"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>From Date <span className="text-red-500">*</span></Label>
                            <Input
                                type="date"
                                value={formData.fromDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, fromDate: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>To Date <span className="text-red-500">*</span></Label>
                            <Input
                                type="date"
                                value={formData.toDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, toDate: e.target.value }))}
                                min={formData.fromDate}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Number of Days</Label>
                        <Input value={formData.numberOfDays} readOnly className="bg-gray-50" />
                    </div>

                    <div className="space-y-2">
                        <Label>Reason <span className="text-red-500">*</span></Label>
                        <Textarea
                            value={formData.reason}
                            onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                            placeholder="Enter reason for leave..."
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Supporting Document</Label>
                        <Input
                            type="file"
                            onChange={(e) => setFormData(prev => ({ ...prev, file: e.target.files ? e.target.files[0] : null }))}
                        />
                        <p className="text-xs text-gray-500">Max size 5MB. Formats: PDF, JPG, PNG.</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-[#1e3a5f]">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Application'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    )
}
