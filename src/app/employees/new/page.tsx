"use client"

export const dynamic = 'force-dynamic'

import React, { Suspense, useEffect, useState } from 'react'
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
import { employeesAPI, mastersAPI, candidatesAPI } from '@/lib/api'
import { ArrowLeft, Loader2, Save, ArrowRight, Upload, Check, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface MasterOption {
  id: number
  name: string
}

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

const STEPS = [
  { id: 1, title: 'Basic Details' },
  { id: 2, title: 'Job Information' },
  { id: 3, title: 'Contact Info' },
  { id: 4, title: 'Photo Upload' },
  { id: 5, title: 'Review & Submit' }
]

export default function AddEmployeePageWrapper() {
  return (
    <Suspense fallback={<MainLayout><div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" /></div></MainLayout>}>
      <AddEmployeePage />
    </Suspense>
  )
}

function AddEmployeePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const candidateId = searchParams.get('candidate_id')

  const [currentStep, setCurrentStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Master data
  const [designations, setDesignations] = useState<MasterOption[]>([])
  const [roles, setRoles] = useState<MasterOption[]>([])
  const [loading, setLoading] = useState(true)

  // Form data
  const [formData, setFormData] = useState({
    // Personal Info
    first_name: '',
    last_name: '',
    email: '',
    personal_email: '',
    phone_number: '',
    date_of_birth: '',
    gender: '',
    nationality: '',
    visa_type: '',
    marital_status: '',

    // Employment Info
    designation_master_id: '',
    role_master_id: '',
    doj: '',
    employee_type: 'Internal',
    department: '',

    // Contact Info
    current_address: '',
    permanent_address: '',
    emergency_contact_name: '',
    emergency_contact_number: '',

    // Bank Info
    bank_name: '',
    bank_account_number: '',
    ifsc_code: '',
    pan_number: '',

    // Photo
    photo: null as File | null,

    // Linking
    potential_candidate_id: ''
  })

  // Preview for photo
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [designationsRes, rolesRes] = await Promise.all([
          mastersAPI.getDesignations(),
          mastersAPI.getRoles(),
        ])
        if (designationsRes?.data) {
          setDesignations(designationsRes.data.map((d: any) => ({
            id: d.id,
            name: d.designationName || d.designation_name
          })))
        }
        if (rolesRes?.data) {
          setRoles(rolesRes.data.map((r: any) => ({
            id: r.id,
            name: r.roleName || r.role_name
          })))
        }
      } catch (error) {
        console.error('Failed to fetch master data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchMasterData()
  }, [])

  // Fetch candidate data if converting
  useEffect(() => {
    const fetchCandidate = async () => {
      if (!candidateId) return

      try {
        setLoading(true)
        const response = await candidatesAPI.getById(Number(candidateId))
        if (response?.data) {
          const candidate = response.data

          // Map gender (1=Male, 2=Female, 3=Other)
          let gender = ''
          if (candidate.gender === 1 || candidate.gender === '1') gender = 'male'
          else if (candidate.gender === 2 || candidate.gender === '2') gender = 'female'
          else if (candidate.gender === 3 || candidate.gender === '3') gender = 'other'
          else if (typeof candidate.gender === 'string') gender = candidate.gender.toLowerCase()

          setFormData(prev => ({
            ...prev,
            first_name: candidate.first_name || '',
            last_name: candidate.last_name || '',
            email: candidate.email || '',
            phone_number: candidate.contact_number || '',
            gender: gender,
            nationality: candidate.nationality || '',
            current_address: candidate.address || '',
            permanent_address: candidate.address || '',
            date_of_birth: candidate.dob ? new Date(candidate.dob).toISOString().split('T')[0] : '',
            designation_master_id: candidate.designation ? String(candidate.designation) : '',
            // Map engagement method if possible, otherwise default
            employee_type: candidate.engagement_method === 'contractual' ? 'External' : 'Internal',
            potential_candidate_id: String(candidateId)
          }))
        }
      } catch (error) {
        console.error('Failed to fetch candidate:', error)
        setError('Failed to load candidate details')
      } finally {
        setLoading(false)
      }
    }

    if (candidateId) {
      fetchCandidate()
    }
  }, [candidateId])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size must be less than 5MB')
        return
      }
      setFormData(prev => ({ ...prev, photo: file }))
      // Create preview URL
      const url = URL.createObjectURL(file)
      setPhotoPreview(url)
      setError('')
    }
  }

  const validateStep = (step: number): boolean => {
    setError('')
    switch (step) {
      case 1: // Basic
        if (!formData.first_name || !formData.last_name || !formData.email) {
          setError('First Name, Last Name, and Work Email are required.')
          return false
        }
        return true
      case 2: // Job
        if (!formData.designation_master_id || !formData.role_master_id) {
          setError('Designation and Role are required.')
          return false
        }
        return true
      case 3: // Contact
        return true // Optional
      case 4: // Photo
        return true // Optional
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError('')
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    try {
      setSaving(true)
      setError('')

      // Convert to FormData for file upload
      const data = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          data.append(key, value as string | Blob)
        }
      })

      const response = await employeesAPI.create(data)

      if (response.success) {
        router.push('/employees')
      } else {
        setError(response.error || 'Failed to create employee')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create employee')
    } finally {
      setSaving(false)
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

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/employees">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Add New Employee</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
              </p>
            </div>
          </div>
        </div>

        {/* Wizard Progress */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-6">
          <div
            className="bg-[#1e3a5f] h-2.5 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          ></div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
            <X className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 min-h-[400px]">
          {/* Step 1: Basic Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name <span className="text-red-500">*</span></Label>
                  <Input id="first_name" value={formData.first_name} onChange={(e) => handleChange('first_name', e.target.value)} placeholder="Enter first name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name <span className="text-red-500">*</span></Label>
                  <Input id="last_name" value={formData.last_name} onChange={(e) => handleChange('last_name', e.target.value)} placeholder="Enter last name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Work Email <span className="text-red-500">*</span></Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="employee@company.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="personal_email">Personal Email</Label>
                  <Input id="personal_email" type="email" value={formData.personal_email} onChange={(e) => handleChange('personal_email', e.target.value)} placeholder="personal@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input id="phone_number" value={formData.phone_number} onChange={(e) => handleChange('phone_number', e.target.value)} placeholder="+1 234 567 8900" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input id="date_of_birth" type="date" value={formData.date_of_birth} onChange={(e) => handleChange('date_of_birth', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marital_status">Marital Status</Label>
                  <Select value={formData.marital_status} onValueChange={(value) => handleChange('marital_status', value)}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input id="nationality" value={formData.nationality} onChange={(e) => handleChange('nationality', e.target.value)} placeholder="Enter nationality" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Job Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="designation_master_id">Designation <span className="text-red-500">*</span></Label>
                  <Select value={formData.designation_master_id} onValueChange={(value) => handleChange('designation_master_id', value)}>
                    <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
                    <SelectContent>
                      {designations.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role_master_id">Role <span className="text-red-500">*</span></Label>
                  <Select value={formData.role_master_id} onValueChange={(value) => handleChange('role_master_id', value)}>
                    <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doj">Date of Joining</Label>
                  <Input id="doj" type="date" value={formData.doj} onChange={(e) => handleChange('doj', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee_type">Employment Type</Label>
                  <Select value={formData.employee_type} onValueChange={(value) => handleChange('employee_type', value)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Internal">Internal (Permanent)</SelectItem>
                      <SelectItem value="External">External (Contract)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" value={formData.department} onChange={(e) => handleChange('department', e.target.value)} placeholder="Enter department" />
                </div>
                <div className="space-y-2">
                  <Label>Visa Location</Label>
                  <Select value={formData.visa_type} onValueChange={(value) => handleChange('visa_type', value)}>
                    <SelectTrigger><SelectValue placeholder="Select visa location" /></SelectTrigger>
                    <SelectContent>
                      {VISA_TYPE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Contact & Bank */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Contact Information</h3>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="current_address">Current Address</Label>
                  <Textarea id="current_address" value={formData.current_address} onChange={(e) => handleChange('current_address', e.target.value)} placeholder="Enter current address" rows={2} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="permanent_address">Permanent Address</Label>
                  <Textarea id="permanent_address" value={formData.permanent_address} onChange={(e) => handleChange('permanent_address', e.target.value)} placeholder="Enter permanent address" rows={2} />
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6"></div>

              <h3 className="text-lg font-medium">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name">Name</Label>
                  <Input id="emergency_contact_name" value={formData.emergency_contact_name} onChange={(e) => handleChange('emergency_contact_name', e.target.value)} placeholder="Contact Name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_number">Number</Label>
                  <Input id="emergency_contact_number" value={formData.emergency_contact_number} onChange={(e) => handleChange('emergency_contact_number', e.target.value)} placeholder="Contact Number" />
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6"></div>

              <h3 className="text-lg font-medium">Bank Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label>Bank Name</Label><Input value={formData.bank_name} onChange={(e) => handleChange('bank_name', e.target.value)} placeholder="Bank Name" /></div>
                <div className="space-y-2"><Label>Account Number</Label><Input value={formData.bank_account_number} onChange={(e) => handleChange('bank_account_number', e.target.value)} placeholder="Account Number" /></div>
                <div className="space-y-2"><Label>IFSC/SWIFT</Label><Input value={formData.ifsc_code} onChange={(e) => handleChange('ifsc_code', e.target.value)} placeholder="IFSC" /></div>
              </div>
            </div>
          )}

          {/* Step 4: Photo Upload */}
          {currentStep === 4 && (
            <div className="space-y-6 flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-full max-w-md space-y-4">
                <Label className="text-lg font-medium text-center block">Upload Employee Photo</Label>

                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                  />
                  {photoPreview ? (
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                      <Image src={photoPreview} alt="Preview" fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                      <Upload className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                  <p className="mt-4 text-sm text-gray-500 text-center">
                    {formData.photo ? formData.photo.name : "Click or drag to upload"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Max 5MB (JPG, PNG)</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Review Details</h3>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="text-gray-500">Name:</span> <span className="font-medium ml-2">{formData.first_name} {formData.last_name}</span></div>
                  <div><span className="text-gray-500">Email:</span> <span className="font-medium ml-2">{formData.email}</span></div>
                  <div><span className="text-gray-500">Role:</span> <span className="font-medium ml-2">{roles.find(r => String(r.id) === formData.role_master_id)?.name}</span></div>
                  <div><span className="text-gray-500">Designation:</span> <span className="font-medium ml-2">{designations.find(d => String(d.id) === formData.designation_master_id)?.name}</span></div>
                  <div><span className="text-gray-500">Photo:</span> <span className="font-medium ml-2">{formData.photo ? 'Uploaded' : 'Not provided'}</span></div>
                </div>
                <div className="bg-yellow-50 text-yellow-800 p-3 rounded text-xs border border-yellow-200 mt-4">
                  Note: A secure login account will be automatically created. The employee can log in using OTP authentication.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || saving}
          >
            Back
          </Button>

          {currentStep < 5 ? (
            <Button onClick={handleNext} className="bg-[#1e3a5f]">
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Submit Employee
                </>
              )}
            </Button>
          )}
        </div>

      </div>
    </MainLayout>
  )
}
