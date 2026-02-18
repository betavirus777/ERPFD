"use client"

import React, { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { candidatesAPI, mastersAPI } from '@/lib/api'
import { ArrowLeft, Save, Loader2, User, Briefcase, DollarSign, FileText } from 'lucide-react'

interface FormData {
  candidateName: string
  email: string
  phone: string
  position: string
  experience: string
  currentCompany: string
  currentSalary: string
  expectedSalary: string
  noticePeriod: string
  location: string
  statusId: string
  source: string
  resumeUrl: string
  linkedinUrl: string
  skills: string
  education: string
  notes: string
}

const SOURCES = ['LinkedIn', 'Indeed', 'Referral', 'Company Website', 'Job Portal', 'Walk-in', 'Other']

export default function EditCandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [statuses, setStatuses] = useState<Array<{ id: number; statusName: string }>>([])
  
  const [formData, setFormData] = useState<FormData>({
    candidateName: '',
    email: '',
    phone: '',
    position: '',
    experience: '',
    currentCompany: '',
    currentSalary: '',
    expectedSalary: '',
    noticePeriod: '',
    location: '',
    statusId: '',
    source: '',
    resumeUrl: '',
    linkedinUrl: '',
    skills: '',
    education: '',
    notes: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [candidateRes, statusesRes] = await Promise.all([
          candidatesAPI.getById(parseInt(id)),
          mastersAPI.getStatuses('candidates'),
        ])

        if (candidateRes?.data) {
          const c = candidateRes.data
          setFormData({
            candidateName: c.candidateName || '',
            email: c.email || '',
            phone: c.phone || '',
            position: c.position || '',
            experience: c.experience || '',
            currentCompany: c.currentCompany || '',
            currentSalary: c.currentSalary || '',
            expectedSalary: c.expectedSalary || '',
            noticePeriod: c.noticePeriod || '',
            location: c.location || '',
            statusId: c.statusId?.toString() || '',
            source: c.source || '',
            resumeUrl: c.resumeUrl || '',
            linkedinUrl: c.linkedinUrl || '',
            skills: c.skills || '',
            education: c.education || '',
            notes: c.notes || '',
          })
        }

        if (statusesRes?.data) {
          setStatuses(statusesRes.data)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
        setError('Failed to load candidate data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.candidateName || !formData.email) {
      setError('Name and email are required')
      return
    }

    try {
      setSaving(true)
      const response = await candidatesAPI.update(parseInt(id), {
        ...formData,
        statusId: formData.statusId ? parseInt(formData.statusId) : null,
      })

      if (response?.success) {
        router.push(`/candidates/${id}`)
      } else {
        setError(response?.error || 'Failed to update candidate')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to update candidate')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="icon" onClick={() => router.push(`/candidates/${id}`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Edit Candidate
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Update candidate information
            </p>
          </div>
          <Button type="submit" disabled={saving} className="bg-[#1e3a5f] hover:bg-[#163050]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.candidateName}
                  onChange={(e) => handleChange('candidateName', e.target.value)}
                  placeholder="Enter full name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email <span className="text-red-500">*</span></Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+1234567890"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="City, Country"
                />
              </div>
              <div className="space-y-2">
                <Label>LinkedIn URL</Label>
                <Input
                  value={formData.linkedinUrl}
                  onChange={(e) => handleChange('linkedinUrl', e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Professional Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Professional Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Position Applied For</Label>
                <Input
                  value={formData.position}
                  onChange={(e) => handleChange('position', e.target.value)}
                  placeholder="Software Engineer"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Current Company</Label>
                  <Input
                    value={formData.currentCompany}
                    onChange={(e) => handleChange('currentCompany', e.target.value)}
                    placeholder="Company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Experience</Label>
                  <Input
                    value={formData.experience}
                    onChange={(e) => handleChange('experience', e.target.value)}
                    placeholder="5 years"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Notice Period</Label>
                  <Input
                    value={formData.noticePeriod}
                    onChange={(e) => handleChange('noticePeriod', e.target.value)}
                    placeholder="30 days"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select value={formData.source} onValueChange={(v) => handleChange('source', v)}>
                    <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                    <SelectContent>
                      {SOURCES.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.statusId} onValueChange={(v) => handleChange('statusId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {statuses.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.statusName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Salary Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Compensation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Current Salary</Label>
                  <Input
                    value={formData.currentSalary}
                    onChange={(e) => handleChange('currentSalary', e.target.value)}
                    placeholder="$100,000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expected Salary</Label>
                  <Input
                    value={formData.expectedSalary}
                    onChange={(e) => handleChange('expectedSalary', e.target.value)}
                    placeholder="$120,000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills & Education */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Skills & Education
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Skills (comma separated)</Label>
                <Input
                  value={formData.skills}
                  onChange={(e) => handleChange('skills', e.target.value)}
                  placeholder="React, Node.js, TypeScript"
                />
              </div>
              <div className="space-y-2">
                <Label>Education</Label>
                <Input
                  value={formData.education}
                  onChange={(e) => handleChange('education', e.target.value)}
                  placeholder="B.Tech in Computer Science"
                />
              </div>
              <div className="space-y-2">
                <Label>Resume URL</Label>
                <Input
                  value={formData.resumeUrl}
                  onChange={(e) => handleChange('resumeUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Add any notes about the candidate..."
                rows={4}
              />
            </CardContent>
          </Card>
        </div>
      </form>
    </MainLayout>
  )
}

