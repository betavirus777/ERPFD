"use client"

import React, { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { reportsAPI } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Loader2, Search, FileText } from 'lucide-react'

export default function DocumentExpiryReport() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any[]>([])
    const [search, setSearch] = useState('')

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await reportsAPI.getExpiryReport()
                if (response?.success) {
                    setData(response.data)
                }
            } catch (error) {
                console.error('Failed to fetch expiry report', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const filteredData = data.filter(item =>
        item.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
        item.documentType?.toLowerCase().includes(search.toLowerCase()) ||
        item.employeeCode?.toLowerCase().includes(search.toLowerCase())
    )

    const getStatusColor = (status: string) => {
        if (status === 'Expired') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800'
        if (status.includes('30')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800'
        if (status.includes('60')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800'
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Document Expiry Report</h1>
                        <p className="text-gray-500">Track employee document expirations (Passports, Visas, etc.)</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search employee or document..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Employee</TableHead>
                                            <TableHead>Document</TableHead>
                                            <TableHead>Number</TableHead>
                                            <TableHead>Expiry Date</TableHead>
                                            <TableHead>Days Left</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredData.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                                    No documents found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredData.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{item.employeeName}</div>
                                                            <div className="text-xs text-gray-500">{item.employeeCode}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="h-4 w-4 text-gray-400" />
                                                            {item.documentType}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{item.documentNumber || '-'}</TableCell>
                                                    <TableCell>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '-'}</TableCell>
                                                    <TableCell>
                                                        <span className={item.daysRemaining < 0 ? 'text-red-600 font-bold' : ''}>
                                                            {item.daysRemaining} days
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={getStatusColor(item.status)}>
                                                            {item.status}
                                                        </Badge>
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
        </MainLayout>
    )
}
