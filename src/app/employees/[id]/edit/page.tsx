"use client"

import React, { useEffect, useState, useCallback } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { employeesAPI, mastersAPI } from '@/lib/api'
import { ArrowLeft, Loader2, Save, User, Briefcase, FileText, CreditCard, GraduationCap, Users, Plus, Trash2, AlertCircle, Download, DollarSign, Shield, Eye } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useParams, useSearchParams } from 'next/navigation'

// Relationship options
const RELATIONSHIP_OPTIONS = [
  { value: 'Father', label: 'Father' },
  { value: 'Mother', label: 'Mother' },
  { value: 'Spouse', label: 'Spouse' },
  { value: 'Sibling', label: 'Sibling' },
  { value: 'Brother', label: 'Brother' },
  { value: 'Sister', label: 'Sister' },
  { value: 'Child', label: 'Child' },
  { value: 'Son', label: 'Son' },
  { value: 'Daughter', label: 'Daughter' },
  { value: 'Friend', label: 'Friend' },
  { value: 'Colleague', label: 'Colleague' },
  { value: 'Other', label: 'Other' },
]

// Visa type options
const VISA_TYPE_OPTIONS = [
  { value: 'Dubai', label: 'Dubai' },
  { value: 'Abu Dhabi', label: 'Abu Dhabi' },
  { value: 'Sharjah', label: 'Sharjah' },
  { value: 'Ajman', label: 'Ajman' },
  { value: 'Umm Al Quwain', label: 'Umm Al Quwain' },
  { value: 'Ras Al Khaimah', label: 'Ras Al Khaimah' },
  { value: 'Fujairah', label: 'Fujairah' },
]

interface MasterOption { id: number; name: string }
interface DocumentType { id: number; documentTypeName: string }
interface AllowanceType { id: number; allowanceType: string }
interface Currency { id: number; currencyCode: string; currencyName: string }

export default function EditEmployeePage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const employeeId = parseInt(params.id as string)
  const initialTab = searchParams.get('tab') || 'profile'

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState(initialTab)
  const [loading, setLoading] = useState(true)

  // Master data
  const [designations, setDesignations] = useState<MasterOption[]>([])
  const [roles, setRoles] = useState<MasterOption[]>([])
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [allowanceTypes, setAllowanceTypes] = useState<AllowanceType[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])

  // Form data
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', personal_email: '', phone_number: '',
    dob: '', nationality: '', visa_type: '', designation_master_id: '', role_master_id: '',
    doj: '', employee_type: 'permanent', engagement_method: '', department: '',
    reporting_to: '', status: true, temp_address: '', permanent_address: '',
  })

  // Bank Details
  const [bankDetails, setBankDetails] = useState({
    id: null as number | null,
    bank_name: '', bank_account_number: '', recipient_name: '',
    bank_address: '', bank_swift_code: '', bank_iban_number: '',
  })

  // Lists (loaded separately)
  const [documents, setDocuments] = useState<any[]>([])
  const [experience, setExperience] = useState<any[]>([])
  const [education, setEducation] = useState<any[]>([])
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([])
  const [familyInfo, setFamilyInfo] = useState<any[]>([])
  const [salaryDetails, setSalaryDetails] = useState<any[]>([])

  // Modal states
  const [documentModalOpen, setDocumentModalOpen] = useState(false)
  const [experienceModalOpen, setExperienceModalOpen] = useState(false)
  const [educationModalOpen, setEducationModalOpen] = useState(false)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [familyModalOpen, setFamilyModalOpen] = useState(false)
  const [salaryModalOpen, setSalaryModalOpen] = useState(false)

  // Modal form data
  const [currentDocument, setCurrentDocument] = useState({ document_master_id: '', document_number: '', start_date: '', end_date: '' })
  const [currentExperience, setCurrentExperience] = useState({ company_name: '', location: '', job_position: '', start_date: '', end_date: '' })
  const [currentEducation, setCurrentEducation] = useState({ institution: '', subject: '', degree: '', grade: '', start_date: '', end_date: '' })
  const [currentContact, setCurrentContact] = useState({ name: '', relationship: '', contact_number: '' })
  const [currentFamily, setCurrentFamily] = useState({ name: '', relationship: '', dob: '', contact_number: '' })

  const [currentSalary, setCurrentSalary] = useState({ allowance_type_id: '', allowance_amount: '', allowance_currency: '' })

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: string, id: number } | null>(null)
  const [tabLoading, setTabLoading] = useState(false)

  // Fetch master data and employee profile
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      const [designationsRes, rolesRes, docTypesRes, allowanceRes, currenciesRes, employeeRes] = await Promise.all([
        mastersAPI.getDesignations(),
        mastersAPI.getRoles(),
        mastersAPI.getDocumentTypes().catch(() => ({ data: [] })),
        mastersAPI.getAllowanceTypes().catch(() => ({ data: [] })),
        mastersAPI.getCurrencies().catch(() => ({ data: [] })),
        employeesAPI.getById(employeeId),
      ])

      if (designationsRes?.data) setDesignations(designationsRes.data.map((d: any) => ({ id: d.id, name: d.designationName || d.designation_name })))
      if (rolesRes?.data) setRoles(rolesRes.data.map((r: any) => ({ id: r.id, name: r.roleName || r.role_name })))
      if (docTypesRes?.data) setDocumentTypes(docTypesRes.data)
      if (allowanceRes?.data) setAllowanceTypes(allowanceRes.data)
      if (currenciesRes?.data) setCurrencies(currenciesRes.data)

      if (employeeRes?.data) {
        const emp = employeeRes.data
        setFormData({
          first_name: emp.first_name || '',
          last_name: emp.last_name || '',
          email: emp.email || '',
          personal_email: emp.personal_email || '',
          phone_number: emp.phone_number || '',
          dob: emp.dob ? new Date(emp.dob).toISOString().split('T')[0] : '',
          nationality: emp.nationality || '',
          visa_type: emp.visa_type || '',
          designation_master_id: String(emp.designation_master_id || ''),
          role_master_id: String(emp.role_master_id || ''),
          doj: emp.doj ? new Date(emp.doj).toISOString().split('T')[0] : '',
          employee_type: emp.employee_type || 'Internal',
          engagement_method: emp.engagement_method || '',
          department: emp.department || '',
          reporting_to: emp.reporting_to || '',
          status: emp.status ?? true,
          temp_address: emp.temp_address || '',
          permanent_address: emp.permanent_address || '',
        })
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setError('Failed to load employee data')
    } finally {
      setLoading(false)
    }
  }, [employeeId])

  // Fetch related data when tab changes
  const fetchTabData = useCallback(async (tab: string) => {
    try {
      setTabLoading(true)
      switch (tab) {
        case 'documents':
          const docsRes = await employeesAPI.getDocuments(employeeId)
          if (docsRes?.data) setDocuments(docsRes.data)
          break
        case 'bank':
          const bankRes = await employeesAPI.getBank(employeeId)
          if (bankRes?.data) setBankDetails({ ...bankRes.data })
          break
        case 'salary':
          const salaryRes = await employeesAPI.getSalary(employeeId)
          if (salaryRes?.data) setSalaryDetails(salaryRes.data)
          break
        case 'experience':
          const expRes = await employeesAPI.getExperience(employeeId)
          if (expRes?.data) setExperience(expRes.data)
          break
        case 'education':
          const eduRes = await employeesAPI.getEducation(employeeId)
          if (eduRes?.data) setEducation(eduRes.data)
          break
        case 'contacts':
          const [contactsRes, familyRes] = await Promise.all([
            employeesAPI.getEmergencyContacts(employeeId),
            employeesAPI.getFamily(employeeId),
          ])
          if (contactsRes?.data) setEmergencyContacts(contactsRes.data)
          if (familyRes?.data) setFamilyInfo(familyRes.data)
          break
      }
    } catch (error) {
      console.error(`Failed to fetch ${tab} data:`, error)
    } finally {
      setTabLoading(false)
    }
  }, [employeeId])

  useEffect(() => {
    if (employeeId) fetchData()
  }, [employeeId, fetchData])

  useEffect(() => {
    if (employeeId && activeTab !== 'profile') fetchTabData(activeTab)
  }, [employeeId, activeTab, fetchTabData])

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleBankChange = (field: string, value: string) => {
    setBankDetails(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmitProfile = async () => {
    if (!formData.first_name || !formData.last_name || !formData.email) {
      setError('Please fill in all required fields (First Name, Last Name, Email)')
      return
    }

    try {
      setSaving(true)
      setError('')

      const response = await employeesAPI.update(employeeId, formData)

      if (response.success) {
        setSuccess('Profile updated successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(response.error || 'Failed to update profile')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBank = async () => {
    try {
      setSaving(true)
      const res = await employeesAPI.saveBank(employeeId, bankDetails)
      if (res.success) {
        setSuccess('Bank details saved!')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (error: any) {
      setError(error.message || 'Failed to save bank details')
    } finally {
      setSaving(false)
    }
  }

  // Document handlers
  const addDocument = async () => {
    if (!currentDocument.document_master_id) {
      setError('Please select a document type')
      return
    }
    try {
      const res = await employeesAPI.saveDocument(employeeId, currentDocument)
      if (res.success) {
        setDocuments([...documents, res.data])
        setCurrentDocument({ document_master_id: '', document_number: '', start_date: '', end_date: '' })
        setDocumentModalOpen(false)
        setSuccess('Document added!')
        setTimeout(() => setSuccess(''), 2000)
      }
    } catch (error: any) {
      setError(error.message || 'Failed to add document')
    }
  }

  const deleteDocument = async (id: number) => {
    try {
      await employeesAPI.deleteDocument(employeeId, id)
      setDocuments(documents.filter(d => d.id !== id))
      setSuccess('Document deleted')
      setTimeout(() => setSuccess(''), 2000)
    } catch (error) {
      console.error('Failed to delete document')
      setError('Failed to delete document')
    }
  }

  // Experience handlers
  const addExperience = async () => {
    if (!currentExperience.company_name || !currentExperience.job_position) {
      setError('Please fill company name and job position')
      return
    }
    try {
      const res = await employeesAPI.saveExperience(employeeId, currentExperience)
      if (res.success) {
        setExperience([...experience, res.data])
        setCurrentExperience({ company_name: '', location: '', job_position: '', start_date: '', end_date: '' })
        setExperienceModalOpen(false)
      }
    } catch (error: any) {
      setError(error.message || 'Failed to add experience')
    }
  }

  const deleteExperience = async (id: number) => {
    try {
      await employeesAPI.deleteExperience(employeeId, id)
      setExperience(experience.filter(e => e.id !== id))
      setSuccess('Experience deleted')
      setTimeout(() => setSuccess(''), 2000)
    } catch (error) {
      console.error('Failed to delete experience')
    }
  }

  // Education handlers
  const addEducation = async () => {
    if (!currentEducation.institution || !currentEducation.degree) {
      setError('Please fill institution and degree')
      return
    }
    try {
      const res = await employeesAPI.saveEducation(employeeId, currentEducation)
      if (res.success) {
        setEducation([...education, res.data])
        setCurrentEducation({ institution: '', subject: '', degree: '', grade: '', start_date: '', end_date: '' })
        setEducationModalOpen(false)
      }
    } catch (error: any) {
      setError(error.message || 'Failed to add education')
    }
  }

  const deleteEducation = async (id: number) => {
    try {
      await employeesAPI.deleteEducation(employeeId, id)
      setEducation(education.filter(e => e.id !== id))
      setSuccess('Education deleted')
      setTimeout(() => setSuccess(''), 2000)
    } catch (error) {
      console.error('Failed to delete education')
    }
  }

  // Emergency contact handlers
  const addContact = async () => {
    if (!currentContact.name || !currentContact.relationship) {
      setError('Please fill name and relationship')
      return
    }
    try {
      const res = await employeesAPI.saveEmergencyContact(employeeId, currentContact)
      if (res.success) {
        setEmergencyContacts([...emergencyContacts, res.data])
        setCurrentContact({ name: '', relationship: '', contact_number: '' })
        setContactModalOpen(false)
      }
    } catch (error: any) {
      setError(error.message || 'Failed to add contact')
    }
  }

  const deleteContact = async (id: number) => {
    try {
      await employeesAPI.deleteEmergencyContact(employeeId, id)
      setEmergencyContacts(emergencyContacts.filter(c => c.id !== id))
      setSuccess('Contact deleted')
      setTimeout(() => setSuccess(''), 2000)
    } catch (error) {
      console.error('Failed to delete contact')
    }
  }

  // Family handlers
  const addFamily = async () => {
    if (!currentFamily.name || !currentFamily.relationship) {
      setError('Please fill name and relationship')
      return
    }
    try {
      const res = await employeesAPI.saveFamily(employeeId, currentFamily)
      if (res.success) {
        setFamilyInfo([...familyInfo, res.data])
        setCurrentFamily({ name: '', relationship: '', dob: '', contact_number: '' })
        setFamilyModalOpen(false)
      }
    } catch (error: any) {
      setError(error.message || 'Failed to add family member')
    }
  }

  const deleteFamily = async (id: number) => {
    try {
      await employeesAPI.deleteFamily(employeeId, id)
      setFamilyInfo(familyInfo.filter(f => f.id !== id))
      setSuccess('Family member deleted')
      setTimeout(() => setSuccess(''), 2000)
    } catch (error) {
      console.error('Failed to delete family member')
    }
  }

  // Salary handlers
  const addSalary = async () => {
    if (!currentSalary.allowance_type_id || !currentSalary.allowance_amount) {
      setError('Please fill allowance type and amount')
      return
    }
    try {
      const res = await employeesAPI.saveSalary(employeeId, currentSalary)
      if (res.success) {
        setSalaryDetails([...salaryDetails, res.data])
        setCurrentSalary({ allowance_type_id: '', allowance_amount: '', allowance_currency: '' })
        setSalaryModalOpen(false)
      }
    } catch (error: any) {
      setError(error.message || 'Failed to add salary component')
    }
  }

  const deleteSalary = async (id: number) => {
    try {
      await employeesAPI.deleteSalary(employeeId, id)
      setSalaryDetails(salaryDetails.filter(s => s.id !== id))
      setSuccess('Salary deleted')
      setTimeout(() => setSuccess(''), 2000)
    } catch (error) {
      console.error('Failed to delete salary')
    }
  }

  const displayDate = (dateString?: string) => {
    if (!dateString) return '-'
    try { return new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return '-' }
  }

  const handlePreviewDocument = (documentPath: string) => {
    const fullUrl = `${process.env.NEXT_PUBLIC_STORAGE_URL}/${documentPath}`
    window.open(fullUrl, '_blank')
  }

  const initiateDelete = (type: string, id: number) => {
    setDeleteTarget({ type, id })
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteConfirmOpen(false)

    switch (deleteTarget.type) {
      case 'document': await deleteDocument(deleteTarget.id); break;
      case 'experience': await deleteExperience(deleteTarget.id); break;
      case 'education': await deleteEducation(deleteTarget.id); break;
      case 'contact': await deleteContact(deleteTarget.id); break;
      case 'family': await deleteFamily(deleteTarget.id); break;
      case 'salary': await deleteSalary(deleteTarget.id); break;
    }
    setDeleteTarget(null)
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

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/employees/${employeeId}`}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Edit Employee</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {formData.first_name} {formData.last_name}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-red-600 hover:text-red-800">&times;</button>
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
            <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white dark:bg-gray-800 border p-1 flex-wrap h-auto gap-1">
            <TabsTrigger value="profile" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white"><User className="w-4 h-4 mr-2" />Profile</TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white"><FileText className="w-4 h-4 mr-2" />Documents</TabsTrigger>
            <TabsTrigger value="bank" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white"><CreditCard className="w-4 h-4 mr-2" />Bank</TabsTrigger>
            <TabsTrigger value="salary" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white"><DollarSign className="w-4 h-4 mr-2" />Salary</TabsTrigger>
            <TabsTrigger value="experience" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white"><Briefcase className="w-4 h-4 mr-2" />Experience</TabsTrigger>
            <TabsTrigger value="education" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white"><GraduationCap className="w-4 h-4 mr-2" />Education</TabsTrigger>
            <TabsTrigger value="contacts" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white"><Users className="w-4 h-4 mr-2" />Contacts</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>First Name <span className="text-red-500">*</span></Label>
                    <Input value={formData.first_name} onChange={(e) => handleChange('first_name', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name <span className="text-red-500">*</span></Label>
                    <Input value={formData.last_name} onChange={(e) => handleChange('last_name', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Work Email <span className="text-red-500">*</span></Label>
                    <Input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Personal Email</Label>
                    <Input type="email" value={formData.personal_email} onChange={(e) => handleChange('personal_email', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input value={formData.phone_number} onChange={(e) => handleChange('phone_number', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input type="date" value={formData.dob} onChange={(e) => handleChange('dob', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nationality</Label>
                    <Input value={formData.nationality} onChange={(e) => handleChange('nationality', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Visa Location</Label>
                    <Select value={formData.visa_type} onValueChange={(value) => handleChange('visa_type', value)}>
                      <SelectTrigger><SelectValue placeholder="Select visa type" /></SelectTrigger>
                      <SelectContent>
                        {VISA_TYPE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Employment Information</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Designation</Label>
                    <Select value={formData.designation_master_id} onValueChange={(value) => handleChange('designation_master_id', value)}>
                      <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
                      <SelectContent>{designations.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={formData.role_master_id} onValueChange={(value) => handleChange('role_master_id', value)}>
                      <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                      <SelectContent>{roles.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Joining</Label>
                    <Input type="date" value={formData.doj} onChange={(e) => handleChange('doj', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Employment Type</Label>
                    <Select value={formData.employee_type} onValueChange={(value) => handleChange('employee_type', value)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Internal">Internal (Permanent)</SelectItem>
                        <SelectItem value="External">External (Contract)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Engagement Method</Label>
                    <Select value={formData.engagement_method} onValueChange={(value) => handleChange('engagement_method', value)}>
                      <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full-Time">Full-Time</SelectItem>
                        <SelectItem value="Part-Time">Part-Time</SelectItem>
                        <SelectItem value="Contractor">Contractor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reports To</Label>
                    <Input value={formData.reporting_to} onChange={(e) => handleChange('reporting_to', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="flex items-center gap-3 pt-2">
                      <Switch checked={formData.status} onCheckedChange={(checked) => handleChange('status', checked)} />
                      <span className="text-sm">{formData.status ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Address</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label>Current Address</Label>
                    <Textarea value={formData.temp_address} onChange={(e) => handleChange('temp_address', e.target.value)} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>Permanent Address</Label>
                    <Textarea value={formData.permanent_address} onChange={(e) => handleChange('permanent_address', e.target.value)} rows={2} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSubmitProfile} disabled={saving} className="bg-[#1e3a5f] hover:bg-[#163050] text-white">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Profile</>}
              </Button>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Documents</CardTitle><CardDescription>Employee documents and certifications</CardDescription></div>
                <Button size="sm" onClick={() => setDocumentModalOpen(true)} className="bg-[#1e3a5f] hover:bg-[#163050]"><Plus className="w-4 h-4 mr-2" />Add Document</Button>
              </CardHeader>
              <CardContent>
                {tabLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                ) : documents.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Document Type</TableHead><TableHead>Document Number</TableHead><TableHead>Start Date</TableHead><TableHead>Expiry Date</TableHead><TableHead>File</TableHead><TableHead>Actions</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">{doc.documentTypeName}</TableCell>
                          <TableCell>{doc.document_number || '-'}</TableCell>
                          <TableCell>{displayDate(doc.start_date)}</TableCell>
                          <TableCell className={doc.end_date && new Date(doc.end_date) < new Date() ? 'text-red-500' : ''}>{displayDate(doc.end_date)}</TableCell>
                          <TableCell>
                            {doc.upload_document && (
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handlePreviewDocument(doc.upload_document)} title="Preview"><Eye className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="sm" asChild><a href={`${process.env.NEXT_PUBLIC_STORAGE_URL}/${doc.upload_document}`} download title="Download"><Download className="w-4 h-4" /></a></Button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell><Button variant="ghost" size="sm" onClick={() => initiateDelete('document', doc.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500"><FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>No documents added</p></div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bank Tab */}
          <TabsContent value="bank">
            <Card>
              <CardHeader><CardTitle>Bank Details</CardTitle><CardDescription>Bank account information for payroll</CardDescription></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label>Bank Name</Label><Input value={bankDetails.bank_name || ''} onChange={(e) => handleBankChange('bank_name', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Account Number</Label><Input value={bankDetails.bank_account_number || ''} onChange={(e) => handleBankChange('bank_account_number', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Recipient Name</Label><Input value={bankDetails.recipient_name || ''} onChange={(e) => handleBankChange('recipient_name', e.target.value)} /></div>
                  <div className="space-y-2"><Label>SWIFT Code</Label><Input value={bankDetails.bank_swift_code || ''} onChange={(e) => handleBankChange('bank_swift_code', e.target.value)} /></div>
                  <div className="space-y-2"><Label>IBAN Number</Label><Input value={bankDetails.bank_iban_number || ''} onChange={(e) => handleBankChange('bank_iban_number', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Bank Address</Label><Input value={bankDetails.bank_address || ''} onChange={(e) => handleBankChange('bank_address', e.target.value)} /></div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button onClick={handleSaveBank} disabled={saving} className="bg-[#1e3a5f] hover:bg-[#163050]">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" />Save Bank Details</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Salary Tab */}
          <TabsContent value="salary">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Salary Details</CardTitle><CardDescription>Allowances and compensation</CardDescription></div>
                <Button size="sm" onClick={() => setSalaryModalOpen(true)} className="bg-[#1e3a5f] hover:bg-[#163050]"><Plus className="w-4 h-4 mr-2" />Add Allowance</Button>
              </CardHeader>
              <CardContent>
                {tabLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                ) : salaryDetails.length > 0 ? (
                  <Table>
                    <TableHeader><TableRow><TableHead>Allowance Type</TableHead><TableHead>Amount</TableHead><TableHead>Currency</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {salaryDetails.map((sal) => (
                        <TableRow key={sal.id}>
                          <TableCell className="font-medium">{sal.allowanceTypeName}</TableCell>
                          <TableCell>{sal.allowance_amount}</TableCell>
                          <TableCell>{sal.allowance_currency_name}</TableCell>
                          <TableCell><Button variant="ghost" size="sm" onClick={() => initiateDelete('salary', sal.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500"><DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>No salary details added</p></div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Experience Tab */}
          <TabsContent value="experience">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Work Experience</CardTitle></div>
                <Button size="sm" onClick={() => setExperienceModalOpen(true)} className="bg-[#1e3a5f] hover:bg-[#163050]"><Plus className="w-4 h-4 mr-2" />Add Experience</Button>
              </CardHeader>
              <CardContent>
                {tabLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                ) : experience.length > 0 ? (
                  <div className="space-y-4">
                    {experience.map((exp) => (
                      <div key={exp.id} className="p-4 border rounded-lg flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{exp.job_position}</h4>
                          <p className="text-gray-600">{exp.company_name}</p>
                          <p className="text-sm text-gray-500">{exp.location}</p>
                          <p className="text-sm text-gray-500">{displayDate(exp.start_date)} - {exp.end_date ? displayDate(exp.end_date) : 'Present'}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => initiateDelete('experience', exp.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500"><Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>No experience added</p></div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Education Tab */}
          <TabsContent value="education">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Education</CardTitle></div>
                <Button size="sm" onClick={() => setEducationModalOpen(true)} className="bg-[#1e3a5f] hover:bg-[#163050]"><Plus className="w-4 h-4 mr-2" />Add Education</Button>
              </CardHeader>
              <CardContent>
                {tabLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                ) : education.length > 0 ? (
                  <div className="space-y-4">
                    {education.map((edu) => (
                      <div key={edu.id} className="p-4 border rounded-lg flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{edu.degree}</h4>
                          <p className="text-gray-600">{edu.institution}</p>
                          <p className="text-sm text-gray-500">{edu.subject} • Grade: {edu.grade || '-'}</p>
                          <p className="text-sm text-gray-500">{displayDate(edu.start_date)} - {displayDate(edu.end_date)}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => initiateDelete('education', edu.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500"><GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>No education added</p></div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Emergency Contacts</CardTitle></div>
                <Button size="sm" onClick={() => setContactModalOpen(true)} className="bg-[#1e3a5f] hover:bg-[#163050]"><Plus className="w-4 h-4 mr-2" />Add Contact</Button>
              </CardHeader>
              <CardContent>
                {tabLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                ) : emergencyContacts.length > 0 ? (
                  <Table>
                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Relationship</TableHead><TableHead>Phone</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {emergencyContacts.map((contact) => (
                        <TableRow key={contact.id}>
                          <TableCell>{contact.name}</TableCell>
                          <TableCell>{contact.relationship}</TableCell>
                          <TableCell>{contact.contact_number}</TableCell>
                          <TableCell><Button variant="ghost" size="sm" onClick={() => deleteContact(contact.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">No emergency contacts</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Family Information</CardTitle></div>
                <Button size="sm" onClick={() => setFamilyModalOpen(true)} className="bg-[#1e3a5f] hover:bg-[#163050]"><Plus className="w-4 h-4 mr-2" />Add Family Member</Button>
              </CardHeader>
              <CardContent>
                {familyInfo.length > 0 ? (
                  <Table>
                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Relationship</TableHead><TableHead>DOB</TableHead><TableHead>Phone</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {familyInfo.map((family) => (
                        <TableRow key={family.id}>
                          <TableCell>{family.name}</TableCell>
                          <TableCell>{family.relationship}</TableCell>
                          <TableCell>{displayDate(family.dob)}</TableCell>
                          <TableCell>{family.contact_number || '-'}</TableCell>
                          <TableCell><Button variant="ghost" size="sm" onClick={() => deleteFamily(family.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">No family information</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Document Modal */}
      <Dialog open={documentModalOpen} onOpenChange={setDocumentModalOpen}>
        <DialogContent><DialogHeader><DialogTitle>Add Document</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Document Type <span className="text-red-500">*</span></Label>
              <Select value={currentDocument.document_master_id} onValueChange={(v) => setCurrentDocument({ ...currentDocument, document_master_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select document type" /></SelectTrigger>
                <SelectContent>{documentTypes.map(dt => <SelectItem key={dt.id} value={String(dt.id)}>{dt.documentTypeName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Document Number</Label><Input value={currentDocument.document_number} onChange={(e) => setCurrentDocument({ ...currentDocument, document_number: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={currentDocument.start_date} onChange={(e) => setCurrentDocument({ ...currentDocument, start_date: e.target.value })} /></div>
              <div className="space-y-2"><Label>Expiry Date</Label><Input type="date" value={currentDocument.end_date} onChange={(e) => setCurrentDocument({ ...currentDocument, end_date: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDocumentModalOpen(false)}>Cancel</Button><Button onClick={addDocument} className="bg-[#1e3a5f] hover:bg-[#163050]">Add Document</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Experience Modal */}
      <Dialog open={experienceModalOpen} onOpenChange={setExperienceModalOpen}>
        <DialogContent><DialogHeader><DialogTitle>Add Experience</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Company Name <span className="text-red-500">*</span></Label><Input value={currentExperience.company_name} onChange={(e) => setCurrentExperience({ ...currentExperience, company_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Job Position <span className="text-red-500">*</span></Label><Input value={currentExperience.job_position} onChange={(e) => setCurrentExperience({ ...currentExperience, job_position: e.target.value })} /></div>
            <div className="space-y-2"><Label>Location</Label><Input value={currentExperience.location} onChange={(e) => setCurrentExperience({ ...currentExperience, location: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={currentExperience.start_date} onChange={(e) => setCurrentExperience({ ...currentExperience, start_date: e.target.value })} /></div>
              <div className="space-y-2"><Label>End Date</Label><Input type="date" value={currentExperience.end_date} onChange={(e) => setCurrentExperience({ ...currentExperience, end_date: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setExperienceModalOpen(false)}>Cancel</Button><Button onClick={addExperience} className="bg-[#1e3a5f] hover:bg-[#163050]">Add Experience</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Education Modal */}
      <Dialog open={educationModalOpen} onOpenChange={setEducationModalOpen}>
        <DialogContent><DialogHeader><DialogTitle>Add Education</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Institution <span className="text-red-500">*</span></Label><Input value={currentEducation.institution} onChange={(e) => setCurrentEducation({ ...currentEducation, institution: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Degree <span className="text-red-500">*</span></Label><Input value={currentEducation.degree} onChange={(e) => setCurrentEducation({ ...currentEducation, degree: e.target.value })} /></div>
              <div className="space-y-2"><Label>Subject</Label><Input value={currentEducation.subject} onChange={(e) => setCurrentEducation({ ...currentEducation, subject: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Grade</Label><Input value={currentEducation.grade} onChange={(e) => setCurrentEducation({ ...currentEducation, grade: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={currentEducation.start_date} onChange={(e) => setCurrentEducation({ ...currentEducation, start_date: e.target.value })} /></div>
              <div className="space-y-2"><Label>End Date</Label><Input type="date" value={currentEducation.end_date} onChange={(e) => setCurrentEducation({ ...currentEducation, end_date: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEducationModalOpen(false)}>Cancel</Button><Button onClick={addEducation} className="bg-[#1e3a5f] hover:bg-[#163050]">Add Education</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Modal */}
      <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
        <DialogContent><DialogHeader><DialogTitle>Add Emergency Contact</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name <span className="text-red-500">*</span></Label><Input value={currentContact.name} onChange={(e) => setCurrentContact({ ...currentContact, name: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Relationship <span className="text-red-500">*</span></Label>
              <Select value={currentContact.relationship} onValueChange={(v) => setCurrentContact({ ...currentContact, relationship: v })}>
                <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                <SelectContent>{RELATIONSHIP_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Phone Number</Label><Input value={currentContact.contact_number} onChange={(e) => setCurrentContact({ ...currentContact, contact_number: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setContactModalOpen(false)}>Cancel</Button><Button onClick={addContact} className="bg-[#1e3a5f] hover:bg-[#163050]">Add Contact</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Family Modal */}
      <Dialog open={familyModalOpen} onOpenChange={setFamilyModalOpen}>
        <DialogContent><DialogHeader><DialogTitle>Add Family Member</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name <span className="text-red-500">*</span></Label><Input value={currentFamily.name} onChange={(e) => setCurrentFamily({ ...currentFamily, name: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Relationship <span className="text-red-500">*</span></Label>
              <Select value={currentFamily.relationship} onValueChange={(v) => setCurrentFamily({ ...currentFamily, relationship: v })}>
                <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                <SelectContent>{RELATIONSHIP_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Date of Birth</Label><Input type="date" value={currentFamily.dob} onChange={(e) => setCurrentFamily({ ...currentFamily, dob: e.target.value })} /></div>
            <div className="space-y-2"><Label>Phone Number</Label><Input value={currentFamily.contact_number} onChange={(e) => setCurrentFamily({ ...currentFamily, contact_number: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setFamilyModalOpen(false)}>Cancel</Button><Button onClick={addFamily} className="bg-[#1e3a5f] hover:bg-[#163050]">Add Family Member</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Salary Modal */}
      <Dialog open={salaryModalOpen} onOpenChange={setSalaryModalOpen}>
        <DialogContent><DialogHeader><DialogTitle>Add Salary Component</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Allowance Type <span className="text-red-500">*</span></Label>
              <Select value={currentSalary.allowance_type_id} onValueChange={(v) => setCurrentSalary({ ...currentSalary, allowance_type_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select allowance type" /></SelectTrigger>
                <SelectContent>{allowanceTypes.map(at => <SelectItem key={at.id} value={String(at.id)}>{at.allowanceType}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Amount <span className="text-red-500">*</span></Label><Input type="number" value={currentSalary.allowance_amount} onChange={(e) => setCurrentSalary({ ...currentSalary, allowance_amount: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currentSalary.allowance_currency} onValueChange={(v) => setCurrentSalary({ ...currentSalary, allowance_currency: v })}>
                <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                <SelectContent>{currencies.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.currencyName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSalaryModalOpen(false)}>Cancel</Button><Button onClick={addSalary} className="bg-[#1e3a5f] hover:bg-[#163050]">Add Allowance</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <CardDescription>Are you sure you want to delete this item? This action cannot be undone.</CardDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
