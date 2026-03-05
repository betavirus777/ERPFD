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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { employeesAPI } from '@/lib/api'
import {
    Loader2,
    User,
    Mail,
    Phone,
    Calendar,
    MapPin,
    Briefcase,
    CreditCard,
    FileText,
    GraduationCap,
    AlertTriangle,
    Eye,
    Download,
    Plus,
    X,
    Save,
} from 'lucide-react'

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

interface MyProfileViewProps {
    empId: number
}

export function MyProfileView({ empId }: MyProfileViewProps) {
    const employeeId = empId.toString()

    const [employee, setEmployee] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState('profile')
    const [tabLoading, setTabLoading] = useState(false)

    const [documents, setDocuments] = useState<any[]>([])
    const [bankDetails, setBankDetails] = useState<any>(null)
    const [education, setEducation] = useState<any[]>([])
    const [emergencyContacts, setEmergencyContacts] = useState<any[]>([])

    // Education add form state
    const [showEduForm, setShowEduForm] = useState(false)
    const [eduSaving, setEduSaving] = useState(false)
    const [eduForm, setEduForm] = useState({ institution: '', degree: '', subject: '', grade: '', start_date: '', end_date: '' })

    // Contact add form state
    const [showContactForm, setShowContactForm] = useState(false)
    const [contactSaving, setContactSaving] = useState(false)
    const [contactForm, setContactForm] = useState({ name: '', relationship: '', contact_number: '' })

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                setLoading(true)
                const response = await employeesAPI.getById(empId)
                if (response?.data) setEmployee(response.data)
            } catch {
                setError('Failed to load profile')
            } finally {
                setLoading(false)
            }
        }
        if (empId) fetchEmployee()
    }, [empId])

    useEffect(() => {
        const fetchTabData = async () => {
            try {
                setTabLoading(true)
                switch (activeTab) {
                    case 'documents': {
                        const res = await employeesAPI.getDocuments(empId)
                        if (res?.data) setDocuments(res.data)
                        break
                    }
                    case 'bank': {
                        const res = await employeesAPI.getBank(empId)
                        if (res?.data) setBankDetails(res.data)
                        break
                    }
                    case 'education': {
                        const res = await employeesAPI.getEducation(empId)
                        if (res?.data) setEducation(res.data)
                        break
                    }
                    case 'contacts': {
                        const res = await employeesAPI.getEmergencyContacts(empId)
                        if (res?.data) setEmergencyContacts(res.data)
                        break
                    }
                }
            } catch {
                console.error(`Failed to fetch ${activeTab} data`)
            } finally {
                setTabLoading(false)
            }
        }
        if (empId && activeTab !== 'profile') fetchTabData()
    }, [empId, activeTab])

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-'
        return new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    const handleAddEducation = async () => {
        if (!eduForm.institution || !eduForm.degree) return
        try {
            setEduSaving(true)
            await employeesAPI.saveEducation(empId, eduForm)
            const res = await employeesAPI.getEducation(empId)
            if (res?.data) setEducation(res.data)
            setEduForm({ institution: '', degree: '', subject: '', grade: '', start_date: '', end_date: '' })
            setShowEduForm(false)
        } catch {
            console.error('Failed to add education')
        } finally {
            setEduSaving(false)
        }
    }

    const handleAddContact = async () => {
        if (!contactForm.name || !contactForm.contact_number) return
        try {
            setContactSaving(true)
            await employeesAPI.saveEmergencyContact(empId, contactForm)
            const res = await employeesAPI.getEmergencyContacts(empId)
            if (res?.data) setEmergencyContacts(res.data)
            setContactForm({ name: '', relationship: '', contact_number: '' })
            setShowContactForm(false)
        } catch {
            console.error('Failed to add contact')
        } finally {
            setContactSaving(false)
        }
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
                    <p className="text-gray-500">{error || 'Profile not found'}</p>
                </div>
            </MainLayout>
        )
    }

    const initials = `${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My Profile</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{employee.employee_code}</p>
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
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {employee.first_name} {employee.last_name}
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400">{employee.designationName || 'No Designation'}</p>
                                <div className="flex items-center gap-3 mt-2">
                                    <Badge className={employee.status
                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                    }>
                                        {employee.status ? 'Active' : 'Inactive'}
                                    </Badge>
                                    {employee.roleName && <Badge variant="outline">{employee.roleName}</Badge>}
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

                {/* Tabs — view-only except Education and Contacts */}
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
                        <TabsTrigger value="education" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white">
                            <GraduationCap className="w-4 h-4 mr-2" />
                            Education
                        </TabsTrigger>
                        <TabsTrigger value="contacts" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white">
                            <Phone className="w-4 h-4 mr-2" />
                            Emergency Contacts
                        </TabsTrigger>
                    </TabsList>

                    {/* Profile Tab — view only */}
                    <TabsContent value="profile" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                                            <p className="font-medium text-gray-900 dark:text-white">{employee.first_name} {employee.last_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Employee ID</p>
                                            <p className="font-medium text-gray-900 dark:text-white font-mono">{employee.employee_code}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{formatDate(employee.dob)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Nationality</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{employee.nationality || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Work Email</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{employee.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Personal Email</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{employee.personal_email || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Phone Number</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{employee.phone_number || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Visa Type</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{employee.visa_type || '-'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

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
                                            <p className="font-medium text-gray-900 dark:text-white">{employee.designationName || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{employee.roleName || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Date of Joining</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{formatDate(employee.doj)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Employment Type</p>
                                            <p className="font-medium text-gray-900 dark:text-white capitalize">{employee.employee_type || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Department</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{employee.department || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                                            <Badge className={employee.status
                                                ? "bg-emerald-100 text-emerald-700 mt-1"
                                                : "bg-red-100 text-red-700 mt-1"
                                            }>
                                                {employee.status ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

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
                                            <p className="font-medium text-gray-900 dark:text-white">{employee.temp_address || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Permanent Address</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{employee.permanent_address || '-'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Documents Tab — view only */}
                    <TabsContent value="documents">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Documents</CardTitle>
                                <CardDescription>Your uploaded documents and certifications</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {tabLoading ? (
                                    <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" /></div>
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
                                                            <div className="flex items-center gap-1">
                                                                <Button variant="ghost" size="sm" onClick={() => handlePreviewDocument(doc.upload_document)} title="Preview">
                                                                    <Eye className="w-4 h-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="sm" onClick={() => handleDownloadDocument(doc.upload_document, `${doc.documentTypeName}_${doc.document_number}`)} title="Download">
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
                                        <p>No documents uploaded yet</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Bank Details Tab — view only */}
                    <TabsContent value="bank">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Bank Details</CardTitle>
                                <CardDescription>Your bank account information on record</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {tabLoading ? (
                                    <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" /></div>
                                ) : bankDetails ? (
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Bank Name</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{bankDetails.bank_name || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Account Number</p>
                                            <p className="font-medium font-mono text-gray-900 dark:text-white">{bankDetails.bank_account_number || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Recipient Name</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{bankDetails.recipient_name || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">SWIFT Code</p>
                                            <p className="font-medium font-mono text-gray-900 dark:text-white">{bankDetails.bank_swift_code || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">IBAN</p>
                                            <p className="font-medium font-mono text-gray-900 dark:text-white">{bankDetails.bank_iban_number || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Bank Address</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{bankDetails.bank_address || '-'}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>No bank details on record. Contact HR to update your bank information.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Education Tab — view + add */}
                    <TabsContent value="education">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Education</CardTitle>
                                    <CardDescription>Academic qualifications</CardDescription>
                                </div>
                                <Button size="sm" className="bg-[#1e3a5f] hover:bg-[#163050]" onClick={() => setShowEduForm(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Education
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {showEduForm && (
                                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">New Education Entry</p>
                                            <Button variant="ghost" size="icon" onClick={() => setShowEduForm(false)}><X className="w-4 h-4" /></Button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Institution *</Label>
                                                <Input placeholder="e.g. MIT" value={eduForm.institution} onChange={e => setEduForm(p => ({ ...p, institution: e.target.value }))} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Degree *</Label>
                                                <Input placeholder="e.g. B.Sc Computer Science" value={eduForm.degree} onChange={e => setEduForm(p => ({ ...p, degree: e.target.value }))} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Subject</Label>
                                                <Input placeholder="e.g. Computer Science" value={eduForm.subject} onChange={e => setEduForm(p => ({ ...p, subject: e.target.value }))} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Grade</Label>
                                                <Input placeholder="e.g. A / 3.8 GPA" value={eduForm.grade} onChange={e => setEduForm(p => ({ ...p, grade: e.target.value }))} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Start Date</Label>
                                                <Input type="date" value={eduForm.start_date} onChange={e => setEduForm(p => ({ ...p, start_date: e.target.value }))} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">End Date</Label>
                                                <Input type="date" value={eduForm.end_date} onChange={e => setEduForm(p => ({ ...p, end_date: e.target.value }))} />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" onClick={() => setShowEduForm(false)}>Cancel</Button>
                                            <Button size="sm" className="bg-[#1e3a5f] hover:bg-[#163050]" onClick={handleAddEducation} disabled={eduSaving}>
                                                {eduSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                                Save
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                {tabLoading ? (
                                    <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" /></div>
                                ) : education.length > 0 ? (
                                    <div className="space-y-3">
                                        {education.map((edu: any, idx: number) => (
                                            <div key={idx} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 dark:text-white">{edu.degree}</h4>
                                                        <p className="text-gray-600 dark:text-gray-400">{edu.institution}</p>
                                                        <p className="text-sm text-gray-500">{edu.subject}{edu.grade ? ` • Grade: ${edu.grade}` : ''}</p>
                                                    </div>
                                                    <span className="text-sm text-gray-500">
                                                        {formatDate(edu.start_date)} – {formatDate(edu.end_date)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>No education records added yet</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Emergency Contacts Tab — view + add */}
                    <TabsContent value="contacts">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Emergency Contacts</CardTitle>
                                    <CardDescription>People to contact in an emergency</CardDescription>
                                </div>
                                <Button size="sm" className="bg-[#1e3a5f] hover:bg-[#163050]" onClick={() => setShowContactForm(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Contact
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {showContactForm && (
                                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">New Emergency Contact</p>
                                            <Button variant="ghost" size="icon" onClick={() => setShowContactForm(false)}><X className="w-4 h-4" /></Button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Name *</Label>
                                                <Input placeholder="Full name" value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Relationship</Label>
                                                <Input placeholder="e.g. Spouse, Parent" value={contactForm.relationship} onChange={e => setContactForm(p => ({ ...p, relationship: e.target.value }))} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Phone Number *</Label>
                                                <Input placeholder="+971 50 000 0000" value={contactForm.contact_number} onChange={e => setContactForm(p => ({ ...p, contact_number: e.target.value }))} />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" onClick={() => setShowContactForm(false)}>Cancel</Button>
                                            <Button size="sm" className="bg-[#1e3a5f] hover:bg-[#163050]" onClick={handleAddContact} disabled={contactSaving}>
                                                {contactSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                                Save
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                {tabLoading ? (
                                    <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" /></div>
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
                                                    <TableCell>{contact.relationship || '-'}</TableCell>
                                                    <TableCell>{contact.contact_number}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <Phone className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>No emergency contacts added yet</p>
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
