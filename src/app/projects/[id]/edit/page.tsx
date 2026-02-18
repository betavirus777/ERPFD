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
import { projectsAPI, clientsAPI, vendorsAPI, mastersAPI } from '@/lib/api'
import { ArrowLeft, Save, Loader2, Briefcase, DollarSign, Calendar, Building2 } from 'lucide-react'

interface FormData {
  projectName: string
  projectCode: string
  clientId: string
  vendorId: string
  startDate: string
  endDate: string
  projectValue: string
  currency: string
  statusId: string
  progress: string
  description: string
  projectManager: string
}

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const [clients, setClients] = useState<Array<{ id: number; clientName: string }>>([])
  const [vendors, setVendors] = useState<Array<{ id: number; vendorName: string }>>([])
  const [statuses, setStatuses] = useState<Array<{ id: number; statusName: string }>>([])
  const [currencies, setCurrencies] = useState<Array<{ id: number; currencyCode: string }>>([])
  
  const [formData, setFormData] = useState<FormData>({
    projectName: '',
    projectCode: '',
    clientId: '',
    vendorId: '',
    startDate: '',
    endDate: '',
    projectValue: '',
    currency: 'USD',
    statusId: '',
    progress: '0',
    description: '',
    projectManager: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectRes, clientsRes, vendorsRes, statusesRes, currenciesRes] = await Promise.all([
          projectsAPI.getById(parseInt(id)),
          clientsAPI.getAll({ limit: 1000 }),
          vendorsAPI.getAll({ limit: 1000 }),
          mastersAPI.getStatuses('projects'),
          mastersAPI.getCurrencies(),
        ])

        if (projectRes?.data) {
          const p = projectRes.data
          setFormData({
            projectName: p.projectName || '',
            projectCode: p.projectCode || '',
            clientId: p.clientId?.toString() || '',
            vendorId: p.vendorId?.toString() || '',
            startDate: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : '',
            endDate: p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : '',
            projectValue: p.projectValue?.toString() || '',
            currency: p.currency || 'USD',
            statusId: p.statusId?.toString() || '',
            progress: p.progress?.toString() || '0',
            description: p.description || '',
            projectManager: p.projectManager || '',
          })
        }

        if (clientsRes?.data) setClients(clientsRes.data)
        if (vendorsRes?.data) setVendors(vendorsRes.data)
        if (statusesRes?.data) setStatuses(statusesRes.data)
        if (currenciesRes?.data) setCurrencies(currenciesRes.data)
      } catch (error) {
        console.error('Failed to fetch data:', error)
        setError('Failed to load project data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.projectName) {
      setError('Project name is required')
      return
    }

    try {
      setSaving(true)
      const response = await projectsAPI.update(parseInt(id), {
        ...formData,
        clientId: formData.clientId ? parseInt(formData.clientId) : null,
        vendorId: formData.vendorId ? parseInt(formData.vendorId) : null,
        statusId: formData.statusId ? parseInt(formData.statusId) : null,
        projectValue: formData.projectValue ? parseFloat(formData.projectValue) : null,
        progress: formData.progress ? parseInt(formData.progress) : 0,
      })

      if (response?.success) {
        router.push(`/projects/${id}`)
      } else {
        setError(response?.error || 'Failed to update project')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to update project')
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
          <Button type="button" variant="ghost" size="icon" onClick={() => router.push(`/projects/${id}`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Edit Project
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Update project information
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
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Project Name <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.projectName}
                  onChange={(e) => handleChange('projectName', e.target.value)}
                  placeholder="Enter project name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project Code</Label>
                  <Input
                    value={formData.projectCode}
                    onChange={(e) => handleChange('projectCode', e.target.value)}
                    placeholder="PRJ-001"
                    disabled
                    className="bg-gray-50"
                  />
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
              </div>
              <div className="space-y-2">
                <Label>Project Manager</Label>
                <Input
                  value={formData.projectManager}
                  onChange={(e) => handleChange('projectManager', e.target.value)}
                  placeholder="Project manager name"
                />
              </div>
              <div className="space-y-2">
                <Label>Progress (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => handleChange('progress', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Client & Vendor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Client & Vendor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Client</Label>
                <Select value={formData.clientId} onValueChange={(v) => handleChange('clientId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.clientName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vendor / Partner</Label>
                <Select value={formData.vendorId} onValueChange={(v) => handleChange('vendorId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">None</SelectItem>
                    {vendors.map(v => (
                      <SelectItem key={v.id} value={String(v.id)}>{v.vendorName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleChange('endDate', e.target.value)}
                    min={formData.startDate}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Budget
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project Value</Label>
                  <Input
                    type="number"
                    value={formData.projectValue}
                    onChange={(e) => handleChange('projectValue', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={formData.currency} onValueChange={(v) => handleChange('currency', v)}>
                    <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="AED">AED</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="INR">INR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter project description..."
                rows={4}
              />
            </CardContent>
          </Card>
        </div>
      </form>
    </MainLayout>
  )
}

