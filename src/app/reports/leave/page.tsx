"use client"

import React, { useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2, Download, FileSpreadsheet, CalendarDays, CheckCircle } from 'lucide-react'
import * as XLSX from 'xlsx'

export default function LeaveReportPage() {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const [year, setYear] = useState(new Date().getFullYear().toString())
    const [stats, setStats] = useState({ leaves: 0, employees: 0 })

    const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString())

    const handleExport = async () => {
        try {
            setLoading(true)
            setError('')
            setSuccess(false)

            const response = await fetch(`/api/reports/leave-export?year=${year}`)
            const result = await response.json()

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch data')
            }

            setStats({
                leaves: result.data.totalLeaves,
                employees: result.data.totalEmployees
            })

            // Create workbook with multiple sheets
            const wb = XLSX.utils.book_new()

            // Sheet 1: Leave Applications
            const leavesWs = XLSX.utils.json_to_sheet(result.data.leaves)
            leavesWs['!cols'] = [
                { wch: 6 },   // SI.No
                { wch: 12 },  // Employee ID
                { wch: 25 },  // Employee Name
                { wch: 12 },  // Start Date
                { wch: 12 },  // End Date
                { wch: 18 },  // Type of Leave
                { wch: 10 },  // No. of Days
                { wch: 8 },   // Year
                { wch: 12 },  // Status
                { wch: 40 },  // Reason
            ]
            XLSX.utils.book_append_sheet(wb, leavesWs, 'Leave Applications')

            // Sheet 2: Leave Balances
            if (result.data.balances && result.data.balances.length > 0) {
                const balancesWs = XLSX.utils.json_to_sheet(result.data.balances)
                balancesWs['!cols'] = [
                    { wch: 12 },  // Employee ID
                    { wch: 25 },  // Employee Name
                    { wch: 18 },  // Leave Type
                    { wch: 8 },   // Year
                    { wch: 12 },  // Entitlement
                    { wch: 10 },  // Availed
                    { wch: 10 },  // Balance
                ]
                XLSX.utils.book_append_sheet(wb, balancesWs, 'Leave Balances')
            }

            // Generate filename
            const filename = `Leave_Report_${year}.xlsx`
            XLSX.writeFile(wb, filename)

            setSuccess(true)
            setTimeout(() => setSuccess(false), 5000)

        } catch (err: any) {
            console.error('Export error:', err)
            setError(err.message || 'Failed to export data')
        } finally {
            setLoading(false)
        }
    }

    return (
        <MainLayout>
            <div className="space-y-6 max-w-4xl mx-auto">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Leave Report</h1>
                    <p className="text-gray-500">Export leave applications and balances to Excel</p>
                </div>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-white dark:from-slate-900 dark:to-slate-800">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg">
                                <CalendarDays className="w-8 h-8" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Leave Report Export</CardTitle>
                                <CardDescription>
                                    Export all leave applications with entitlement, availed, and balance information
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Year Selection */}
                        <div className="space-y-2">
                            <Label>Select Year</Label>
                            <Select value={year} onValueChange={setYear}>
                                <SelectTrigger className="w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map(y => (
                                        <SelectItem key={y} value={y}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Report Contents */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                            <h3 className="font-medium text-sm text-slate-700 dark:text-slate-300 mb-3">Report Contains:</h3>
                            <div className="space-y-3">
                                <div>
                                    <Badge className="bg-purple-100 text-purple-800 mb-2">Sheet 1: Leave Applications</Badge>
                                    <div className="flex flex-wrap gap-2 ml-2">
                                        {['Employee Name', 'Start Date', 'End Date', 'Type of Leave', 'No. of Days', 'Year', 'Status'].map(col => (
                                            <Badge key={col} variant="outline" className="bg-white text-xs">{col}</Badge>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <Badge className="bg-indigo-100 text-indigo-800 mb-2">Sheet 2: Leave Balances</Badge>
                                    <div className="flex flex-wrap gap-2 ml-2">
                                        {['Employee Name', 'Leave Type', 'Entitlement', 'Availed', 'Balance'].map(col => (
                                            <Badge key={col} variant="outline" className="bg-white text-xs">{col}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        {stats.leaves > 0 && (
                            <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                                <FileSpreadsheet className="w-5 h-5 text-purple-600" />
                                <span className="text-sm text-purple-800 dark:text-purple-200">
                                    <strong>{stats.leaves}</strong> leave records from <strong>{stats.employees}</strong> employees
                                </span>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-sm text-green-800">Export completed! Check your downloads.</span>
                            </div>
                        )}

                        <Button
                            onClick={handleExport}
                            disabled={loading}
                            size="lg"
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Generating Report...
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5 mr-2" />
                                    Export Leave Report
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    )
}
