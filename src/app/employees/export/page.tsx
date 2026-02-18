"use client"

import React, { useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Download, FileSpreadsheet, Users, CheckCircle } from 'lucide-react'
import * as XLSX from 'xlsx'

export default function EmployeeExportPage() {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const [stats, setStats] = useState({ total: 0 })

    const handleExport = async () => {
        try {
            setLoading(true)
            setError('')
            setSuccess(false)

            // Fetch export data
            const response = await fetch('/api/employees/export')
            const result = await response.json()

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch data')
            }

            const data = result.data.data
            setStats({ total: result.data.total })

            // Create workbook
            const wb = XLSX.utils.book_new()

            // Create worksheet from data
            const ws = XLSX.utils.json_to_sheet(data)

            // Set column widths for better readability
            const colWidths = [
                { wch: 6 },   // SI.No
                { wch: 12 },  // Employee ID
                { wch: 25 },  // Employee Name
                { wch: 20 },  // FD Designation
                { wch: 20 },  // Visa Designation
                { wch: 12 },  // Date of Joining
                { wch: 10 },  // Tenure
                { wch: 12 },  // Leaving Date
                { wch: 15 },  // Probation Period
                { wch: 18 },  // Probation Confirmation
                { wch: 12 },  // Basic Salary
                { wch: 12 },  // Allowances
                { wch: 12 },  // Gross Salary
                { wch: 15 },  // Air Ticket Allowance
                { wch: 15 },  // UAE Contact No.
                { wch: 30 },  // Work Email
                { wch: 30 },  // Personal Email
                { wch: 12 },  // Notice Period
                { wch: 15 },  // Contract Type
                { wch: 15 },  // Account
                { wch: 15 },  // Work Location
                { wch: 12 },  // Work Setup
                { wch: 18 },  // Benefits Entitlement
                { wch: 15 },  // Nationality
                { wch: 10 },  // Gender
                { wch: 12 },  // Date of Birth
                { wch: 6 },   // Age
                { wch: 12 },  // Civil Status
                { wch: 15 },  // Place of Birth
                { wch: 15 },  // Passport No.
                { wch: 15 },  // Passport Issue Date
                { wch: 15 },  // Passport Expiry Date
                { wch: 15 },  // Unified ID
                { wch: 15 },  // Visa Type
                { wch: 18 },  // Visa Issue Authority
                { wch: 18 },  // Residence Permit No.
                { wch: 18 },  // Residence Visa Issue
                { wch: 18 },  // Residence Visa Expiry
                { wch: 20 },  // Emirates ID Number
                { wch: 18 },  // Emirates ID Expiry
                { wch: 15 },  // Labour Card No.
                { wch: 18 },  // Labour Card Expiry
                { wch: 10 },  // Insurance
                { wch: 18 },  // Insurance Category
                { wch: 18 },  // Insurance Card No.
                { wch: 18 },  // Insurance Expiry
                { wch: 15 },  // ILOE Expiry
                { wch: 20 },  // Bank Name
                { wch: 25 },  // Account Name
                { wch: 20 },  // Account No.
                { wch: 30 },  // IBAN Number
                { wch: 15 },  // UAE Routing Code
                { wch: 15 },  // IFSC Code
                { wch: 35 },  // UAE Address
                { wch: 35 },  // Home Country Address
                { wch: 18 },  // Home Country Contact
                { wch: 25 },  // Emergency Contact Name
                { wch: 18 },  // Emergency Contact No.
                { wch: 20 },  // Emergency Contact Relationship
                { wch: 25 },  // Emergency Contact Name2
                { wch: 18 },  // Emergency Contact No.3
                { wch: 20 },  // Emergency Contact Relationship4
            ]
            ws['!cols'] = colWidths

            // Style header row
            const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const address = XLSX.utils.encode_cell({ r: 0, c: C })
                if (!ws[address]) continue
                ws[address].s = {
                    font: { bold: true, color: { rgb: "FFFFFF" } },
                    fill: { fgColor: { rgb: "1E3A5F" } },
                    alignment: { horizontal: "center", vertical: "center" }
                }
            }

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Employee Data')

            // Generate filename with date
            const today = new Date().toISOString().split('T')[0]
            const filename = `Employee_Export_${today}.xlsx`

            // Download
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
                    <h1 className="text-2xl font-bold tracking-tight">Employee Data Export</h1>
                    <p className="text-gray-500">Export comprehensive employee data to Excel</p>
                </div>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                                <FileSpreadsheet className="w-8 h-8" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Full Employee Report</CardTitle>
                                <CardDescription>
                                    Export all employee data with 60+ columns including personal, visa, banking, and emergency contact information
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Columns Preview */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                            <h3 className="font-medium text-sm text-slate-700 dark:text-slate-300 mb-3">Included Data Categories:</h3>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="bg-white dark:bg-slate-700">Basic Info</Badge>
                                <Badge variant="outline" className="bg-white dark:bg-slate-700">Employment</Badge>
                                <Badge variant="outline" className="bg-white dark:bg-slate-700">Salary</Badge>
                                <Badge variant="outline" className="bg-white dark:bg-slate-700">Contact</Badge>
                                <Badge variant="outline" className="bg-white dark:bg-slate-700">Passport</Badge>
                                <Badge variant="outline" className="bg-white dark:bg-slate-700">Visa</Badge>
                                <Badge variant="outline" className="bg-white dark:bg-slate-700">Emirates ID</Badge>
                                <Badge variant="outline" className="bg-white dark:bg-slate-700">Labour Card</Badge>
                                <Badge variant="outline" className="bg-white dark:bg-slate-700">Insurance</Badge>
                                <Badge variant="outline" className="bg-white dark:bg-slate-700">Banking</Badge>
                                <Badge variant="outline" className="bg-white dark:bg-slate-700">Emergency</Badge>
                                <Badge variant="outline" className="bg-white dark:bg-slate-700">Address</Badge>
                            </div>
                        </div>

                        {/* Export Stats */}
                        {stats.total > 0 && (
                            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                                <Users className="w-5 h-5 text-blue-600" />
                                <span className="text-sm text-blue-800 dark:text-blue-200">
                                    <strong>{stats.total}</strong> employees exported in last run
                                </span>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Success Message */}
                        {success && (
                            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-sm text-green-800 dark:text-green-200">
                                    Export completed successfully! Check your downloads folder.
                                </span>
                            </div>
                        )}

                        {/* Export Button */}
                        <Button
                            onClick={handleExport}
                            disabled={loading}
                            size="lg"
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Generating Export...
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5 mr-2" />
                                    Export to Excel
                                </>
                            )}
                        </Button>

                        <p className="text-xs text-center text-gray-400">
                            The export will include all active employees with their complete records
                        </p>
                    </CardContent>
                </Card>

                {/* Column List Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">All Exported Columns (60+)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs text-gray-600">
                            {[
                                'SI.No.', 'Employee ID', 'Employee Name', 'FD Designation', 'Visa Designation',
                                'Date of Joining', 'Tenure', 'Leaving Date', 'Probation Period', 'Probation Confirmation',
                                'Basic Salary', 'Allowances', 'Gross Salary', 'Air Ticket Allowance', 'UAE Contact No.',
                                'Work Email', 'Personal Email', 'Notice Period', 'Contract Type', 'Account',
                                'Work Location', 'Work Setup', 'Benefits Entitlement', 'Nationality', 'Gender',
                                'Date of Birth', 'Age', 'Civil Status', 'Place of Birth', 'Passport No.',
                                'Passport Issue Date', 'Passport Expiry Date', 'Unified ID', 'Visa Type', 'Visa Issue Authority',
                                'Residence Permit No.', 'Residence Visa Issue', 'Residence Visa Expiry', 'Emirates ID Number', 'Emirates ID Expiry',
                                'Labour Card No.', 'Labour Card Expiry', 'Insurance', 'Insurance Category', 'Insurance Card No.',
                                'Insurance Expiry Date', 'ILOE Expiry Date', 'Bank Name', 'Account Name', 'Account No.',
                                'IBAN Number', 'UAE Routing Code', 'IFSC Code', 'UAE Address', 'Home Country Address',
                                'Home Country Contact', 'Emergency Contact 1', 'Emergency Phone 1', 'Emergency Relationship 1',
                                'Emergency Contact 2', 'Emergency Phone 2', 'Emergency Relationship 2'
                            ].map((col, i) => (
                                <div key={i} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded">
                                    {col}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    )
}
