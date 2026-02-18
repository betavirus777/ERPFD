"use client"

import React, { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { employeesAPI } from '@/lib/api'
import {
    ArrowLeft,
    Pencil,
    Loader2,
    User,
    Mail,
    Phone,
    Calendar,
    MapPin,
    Briefcase,
    Building2,
    CreditCard,
    FileText,
    Users,
    GraduationCap,
    Award,
    Shield,
    Download,
    ExternalLink,
    Plus,
    AlertTriangle,
    DollarSign,
    Eye,
} from 'lucide-react'
import Link from 'next/link'

interface EmployeeDetail {
    id: number
    uid: string
    employee_code: string
    employee_photo?: string
    first_name: string
    last_name: string
    email: string
    personal_email?: string
    phone_number?: string
    dob?: string
    doj?: string
    permanent_address?: string
    temp_address?: string
    status: boolean
    visa_type?: string
    employee_type?: string
    engagement_method?: string
    nationality?: string
    department?: string
    reporting_to?: string
    designationName?: string
    roleName?: string
    statusName?: string
    designation_master_id?: number
    role_master_id?: number
    emergencyContacts?: any[]
    familyInfo?: any[]
    education?: any[]
    experience?: any[]
    documents?: any[]
    bankDetails?: any[]
    salaryDetails?: any[]
    consentForms?: any[]
}

const handlePreviewDocument = (documentPath: string) => {
    const fullUrl = `${process.env.NEXT_PUBLIC_STORAGE_URL}/${documentPath}`
    window.open(fullUrl, '_blank')
}

const handleDownloadDocument = (documentPath: string, fileName?: string) => {
    const fullUrl = `${process.env.NEXT_PUBLIC_STORAGE_URL}/${documentPath}`
    const link = document.createElement('a')
    link.href = fullUrl
    link.download = fileName || documentPath.split('/').pop() || 'document'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

interface EmployeeDetailViewProps {
    empId: number
}

export function EmployeeDetailView({ empId }: EmployeeDetailViewProps) {
    const employeeId = empId.toString()

    const [employee, setEmployee] = useState<EmployeeDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState('profile')
    const [tabLoading, setTabLoading] = useState(false)

    // Separate state for related data
    const [documents, setDocuments] = useState<any[]>([])
    const [bankDetails, setBankDetails] = useState<any>(null)
    const [salaryDetails, setSalaryDetails] = useState<any[]>([])
    const [experience, setExperience] = useState<any[]>([])
    const [education, setEducation] = useState<any[]>([])
    const [emergencyContacts, setEmergencyContacts] = useState<any[]>([])
    const [familyInfo, setFamilyInfo] = useState<any[]>([])

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                setLoading(true)
                const response = await employeesAPI.getById(empId)
                if (response?.data) {
                    setEmployee(response.data)
                }
            } catch (error) {
                console.error('Failed to fetch employee:', error)
                setError('Failed to load employee data')
            } finally {
                setLoading(false)
            }
        }

        if (employeeId) {
            fetchEmployee()
        }
    }, [employeeId, empId])

    // Fetch tab data when tab changes
    useEffect(() => {
        const fetchTabData = async () => {
            try {
                setTabLoading(true)
                switch (activeTab) {
                    case 'documents':
                        const docsRes = await employeesAPI.getDocuments(empId)
                        if (docsRes?.data) setDocuments(docsRes.data)
                        break
                    case 'bank':
                        const bankRes = await employeesAPI.getBank(empId)
                        if (bankRes?.data) setBankDetails(bankRes.data)
                        break
                    case 'salary':
                        const salaryRes = await employeesAPI.getSalary(empId)
                        if (salaryRes?.data) setSalaryDetails(salaryRes.data)
                        break
                    case 'experience':
                        const expRes = await employeesAPI.getExperience(empId)
                        if (expRes?.data) setExperience(expRes.data)
                        break
                    case 'education':
                        const eduRes = await employeesAPI.getEducation(empId)
                        if (eduRes?.data) setEducation(eduRes.data)
                        break
                    case 'contacts':
                        const [contactsRes, familyRes] = await Promise.all([
                            employeesAPI.getEmergencyContacts(empId),
                            employeesAPI.getFamily(empId),
                        ])
                        if (contactsRes?.data) setEmergencyContacts(contactsRes.data)
                        if (familyRes?.data) setFamilyInfo(familyRes.data)
                        break
                }
            } catch (error) {
                console.error(`Failed to fetch ${activeTab} data:`, error)
            } finally {
                setTabLoading(false)
            }
        }

        if (empId && activeTab !== 'profile') {
            fetchTabData()
        }
    }, [empId, activeTab])

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-'
        return new Date(dateString).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
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

    if (error || !employee) {
        return (
            <MainLayout>
                <div className="flex flex-col items-center justify-center h-96 gap-4">
                    <AlertTriangle className="w-12 h-12 text-amber-500" />
                    <p className="text-gray-500">{error || 'Employee not found'}</p>
                    <Link href="/employees">
                        <Button variant="outline">Back to Employees</Button>
                    </Link>
                </div>
            </MainLayout>
        )
    }

    const initials = `${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/employees">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                                Employee Details
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                {employee.employee_code}
                            </p>
                        </div>
                    </div>
                    <Link href={`/employees/${employeeId}/edit`}>
                        <Button className="bg-[#1e3a5f] hover:bg-[#163050] text-white">
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit Employee
                        </Button>
                    </Link>
                </div>

                {/* Profile Card */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-shrink-0">
                                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                                    {employee.employee_photo ? (
                                        <AvatarImage
                                            src={`${process.env.NEXT_PUBLIC_STORAGE_URL || ''}/${employee.employee_photo}`}
                                            alt={`${employee.first_name} ${employee.last_name}`}
                                        />
                                    ) : null}
                                    <AvatarFallback className="bg-gradient-to-br from-[#1e3a5f] to-[#2d5a87] text-white text-2xl font-medium">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="flex-grow">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {employee.first_name} {employee.last_name}
                                        </h2>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            {employee.designationName || 'No Designation'}
                                        </p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <Badge className={employee.status
                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                            }>
                                                {employee.status ? 'Active' : 'Inactive'}
                                            </Badge>
                                            {employee.employee_type && (
                                                <Badge variant="outline" className="capitalize">
                                                    {employee.employee_type}
                                                </Badge>
                                            )}
                                            {employee.roleName && (
                                                <Badge variant="outline">
                                                    {employee.roleName}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                        <Mail className="w-4 h-4" />
                                        <span className="text-sm">{employee.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                        <Phone className="w-4 h-4" />
                                        <span className="text-sm">{employee.phone_number || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-sm">Joined {formatDate(employee.doj)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1">
                        <TabsTrigger value="profile" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white">
                            <User className="w-4 h-4 mr-2" />
                            Profile
                        </TabsTrigger>
                        <TabsTrigger value="documents" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white">
                            <FileText className="w-4 h-4 mr-2" />
                            Documents
                        </TabsTrigger>
                        <TabsTrigger value="bank" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white">
                            <CreditCard className="w-4 h-4 mr-2" />
                            Bank Details
                        </TabsTrigger>
                        <TabsTrigger value="salary" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white">
                            <DollarSign className="w-4 h-4 mr-2" />
                            Salary
                        </TabsTrigger>
                        <TabsTrigger value="experience" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white">
                            <Briefcase className="w-4 h-4 mr-2" />
                            Experience
                        </TabsTrigger>
                        <TabsTrigger value="education" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white">
                            <GraduationCap className="w-4 h-4 mr-2" />
                            Education
                        </TabsTrigger>
                        <TabsTrigger value="family" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white">
                            <Users className="w-4 h-4 mr-2" />
                            Family & Contacts
                        </TabsTrigger>
                    </TabsList>

                    {/* Profile Tab */}
                    <TabsContent value="profile" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Personal Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <User className="w-5 h-5" />
                                        Personal Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {employee.first_name} {employee.last_name}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Employee ID</p>
                                            <p className="font-medium text-gray-900 dark:text-white font-mono">
                                                {employee.employee_code}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {formatDate(employee.dob)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Nationality</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {employee.nationality || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Work Email</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {employee.email}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Personal Email</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {employee.personal_email || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Phone Number</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {employee.phone_number || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Visa Type</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {employee.visa_type || '-'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Employment Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Briefcase className="w-5 h-5" />
                                        Employment Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Designation</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {employee.designationName || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {employee.roleName || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Date of Joining</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {formatDate(employee.doj)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Employment Type</p>
                                            <p className="font-medium text-gray-900 dark:text-white capitalize">
                                                {employee.employee_type || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Engagement Method</p>
                                            <p className="font-medium text-gray-900 dark:text-white capitalize">
                                                {employee.engagement_method || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Reports To</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {employee.reporting_to || '-'}
                                            </p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                                            <Badge className={employee.status
                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 mt-1"
                                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 mt-1"
                                            }>
                                                {employee.status ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Address Information */}
                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <MapPin className="w-5 h-5" />
                                        Address Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Current Address</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {employee.temp_address || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Permanent Address</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {employee.permanent_address || '-'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Documents Tab */}
                    <TabsContent value="documents">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Documents</CardTitle>
                                    <CardDescription>Employee documents and certifications</CardDescription>
                                </div>
                                <Link href={`/employees/${employeeId}/edit?tab=documents`}>
                                    <Button size="sm" className="bg-[#1e3a5f] hover:bg-[#163050]">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Document
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent>
                                {tabLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
                                    </div>
                                ) : documents.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Document Type</TableHead>
                                                <TableHead>Document Number</TableHead>
                                                <TableHead>Start Date</TableHead>
                                                <TableHead>Expiry Date</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {documents.map((doc: any, idx: number) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium">{doc.documentTypeName || '-'}</TableCell>
                                                    <TableCell>{doc.document_number || '-'}</TableCell>
                                                    <TableCell>{formatDate(doc.start_date)}</TableCell>
                                                    <TableCell>
                                                        {doc.end_date ? (
                                                            <span className={new Date(doc.end_date) < new Date() ? 'text-red-500' : ''}>
                                                                {formatDate(doc.end_date)}
                                                            </span>
                                                        ) : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {doc.upload_document && (
                                                            <div className="flex items-center">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handlePreviewDocument(doc.upload_document)}
                                                                    title="Preview Document"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleDownloadDocument(doc.upload_document, `${doc.documentTypeName}_${doc.document_number}`)}
                                                                    title="Download Document"
                                                                >
                                                                    <Download className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>No documents uploaded</p>
                                        <Link href={`/employees/${employeeId}/edit?tab=documents`}>
                                            <Button variant="link" className="mt-2 text-[#1e3a5f]">
                                                Add first document
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Bank Details Tab */}
                    <TabsContent value="bank">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Bank Details</CardTitle>
                                    <CardDescription>Employee bank account information</CardDescription>
                                </div>
                                <Link href={`/employees/${employeeId}/edit?tab=bank`}>
                                    <Button size="sm" variant="outline">
                                        <Pencil className="w-4 h-4 mr-2" />
                                        Edit
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent>
                                {tabLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
                                    </div>
                                ) : bankDetails ? (
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Bank Name</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{bankDetails.bank_name || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Account Number</p>
                                            <p className="font-medium text-gray-900 dark:text-white font-mono">{bankDetails.bank_account_number || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Recipient Name</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{bankDetails.recipient_name || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">SWIFT Code</p>
                                            <p className="font-medium text-gray-900 dark:text-white font-mono">{bankDetails.bank_swift_code || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">IBAN Number</p>
                                            <p className="font-medium text-gray-900 dark:text-white font-mono">{bankDetails.bank_iban_number || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Bank Address</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{bankDetails.bank_address || '-'}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>No bank details added</p>
                                        <Link href={`/employees/${employeeId}/edit?tab=bank`}>
                                            <Button variant="link" className="mt-2 text-[#1e3a5f]">
                                                Add bank details
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Salary Tab */}
                    <TabsContent value="salary">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Salary Details</CardTitle>
                                    <CardDescription>Allowances and compensation</CardDescription>
                                </div>
                                <Link href={`/employees/${employeeId}/edit?tab=salary`}>
                                    <Button size="sm" className="bg-[#1e3a5f] hover:bg-[#163050]">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Allowance
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent>
                                {tabLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
                                    </div>
                                ) : salaryDetails.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Allowance Type</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Currency</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {salaryDetails.map((salary: any, idx: number) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium">{salary.allowanceTypeName || '-'}</TableCell>
                                                    <TableCell>{salary.allowance_amount || '-'}</TableCell>
                                                    <TableCell>{salary.allowance_currency_name || '-'}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>No salary details added</p>
                                        <Link href={`/employees/${employeeId}/edit?tab=salary`}>
                                            <Button variant="link" className="mt-2 text-[#1e3a5f]">
                                                Add salary details
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Experience Tab */}
                    <TabsContent value="experience">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Work Experience</CardTitle>
                                    <CardDescription>Previous employment history</CardDescription>
                                </div>
                                <Link href={`/employees/${employeeId}/edit?tab=experience`}>
                                    <Button size="sm" className="bg-[#1e3a5f] hover:bg-[#163050]">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Experience
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent>
                                {tabLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
                                    </div>
                                ) : experience.length > 0 ? (
                                    <div className="space-y-4">
                                        {experience.map((exp: any, idx: number) => (
                                            <div key={idx} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 dark:text-white">{exp.job_position}</h4>
                                                        <p className="text-gray-600 dark:text-gray-400">{exp.company_name}</p>
                                                        <p className="text-sm text-gray-500">{exp.location}</p>
                                                    </div>
                                                    <span className="text-sm text-gray-500">
                                                        {formatDate(exp.start_date)} - {exp.end_date ? formatDate(exp.end_date) : 'Present'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>No experience added</p>
                                        <Link href={`/employees/${employeeId}/edit?tab=experience`}>
                                            <Button variant="link" className="mt-2 text-[#1e3a5f]">
                                                Add experience
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Education Tab */}
                    <TabsContent value="education">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Education</CardTitle>
                                    <CardDescription>Academic qualifications</CardDescription>
                                </div>
                                <Link href={`/employees/${employeeId}/edit?tab=education`}>
                                    <Button size="sm" className="bg-[#1e3a5f] hover:bg-[#163050]">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Education
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent>
                                {tabLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
                                    </div>
                                ) : education.length > 0 ? (
                                    <div className="space-y-4">
                                        {education.map((edu: any, idx: number) => (
                                            <div key={idx} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 dark:text-white">{edu.degree}</h4>
                                                        <p className="text-gray-600 dark:text-gray-400">{edu.institution}</p>
                                                        <p className="text-sm text-gray-500">{edu.subject} • Grade: {edu.grade || '-'}</p>
                                                    </div>
                                                    <span className="text-sm text-gray-500">
                                                        {formatDate(edu.start_date)} - {formatDate(edu.end_date)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>No education added</p>
                                        <Link href={`/employees/${employeeId}/edit?tab=education`}>
                                            <Button variant="link" className="mt-2 text-[#1e3a5f]">
                                                Add education
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Family & Contacts Tab */}
                    <TabsContent value="family" className="space-y-6">
                        {/* Emergency Contacts */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Emergency Contacts</CardTitle>
                                    <CardDescription>People to contact in case of emergency</CardDescription>
                                </div>
                                <Link href={`/employees/${employeeId}/edit?tab=contacts`}>
                                    <Button size="sm" className="bg-[#1e3a5f] hover:bg-[#163050]">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Contact
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent>
                                {tabLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
                                    </div>
                                ) : emergencyContacts.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Relationship</TableHead>
                                                <TableHead>Phone Number</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {emergencyContacts.map((contact: any, idx: number) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium">{contact.name}</TableCell>
                                                    <TableCell>{contact.relationship}</TableCell>
                                                    <TableCell>{contact.contact_number}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <Phone className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>No emergency contacts added</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Family Info */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Family Information</CardTitle>
                                    <CardDescription>Family members and dependents</CardDescription>
                                </div>
                                <Link href={`/employees/${employeeId}/edit?tab=family`}>
                                    <Button size="sm" className="bg-[#1e3a5f] hover:bg-[#163050]">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Family Member
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent>
                                {tabLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
                                    </div>
                                ) : familyInfo.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Relationship</TableHead>
                                                <TableHead>Date of Birth</TableHead>
                                                <TableHead>Phone Number</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {familyInfo.map((family: any, idx: number) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium">{family.name}</TableCell>
                                                    <TableCell>{family.relationship}</TableCell>
                                                    <TableCell>{formatDate(family.dob)}</TableCell>
                                                    <TableCell>{family.contact_number || '-'}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>No family information added</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    )
}
