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
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { mastersAPI, candidatesAPI } from '@/lib/api'
import {
  UserPlus, Search, MoreHorizontal, Pencil, Trash2, Eye, Plus,
  Loader2, RefreshCw, Users, Mail, Phone, MapPin, Briefcase, AlertCircle, CheckCircle
} from 'lucide-react'
import Link from 'next/link'

interface Candidate {
  id: number
  firstName: string
  lastName: string
  fullName: string
  email: string
  contactNumber?: string
  gender: string
  dob?: string
  address?: string
  nationality?: string
  country: string
  designation: string
  designationId?: number
  engagementMethod: string
  statusName: string
  status: boolean
  createdAt: string
}

// ... (KEEP GENDER_OPTIONS and ENGAGEMENT_OPTIONS)
const GENDER_OPTIONS = [
  { value: '1', label: 'Male' },
  { value: '2', label: 'Female' },
  { value: '3', label: 'Other' },
]

const ENGAGEMENT_OPTIONS = [
  { value: 'full-time', label: 'Full-Time' },
  { value: 'part-time', label: 'Part-Time' },
  { value: 'contractual', label: 'Contractual' },
]

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [designations, setDesignations] = useState<any[]>([])
  const [countries, setCountries] = useState<any[]>([])

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Modals
  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Form
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', contact_number: '', gender: '',
    dob: '', address: '', nationality: '', potential_country: '', designation: '',
    engagement_method: '', status: true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true)
      const params: any = { page, limit: 10 }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter

      const response = await candidatesAPI.getAll(params)
      if (response?.data) {
        setCandidates(response.data)
        setTotalPages(response.pagination?.totalPages || 1)
        setTotal(response.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Failed to fetch candidates:', error)
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  const fetchMasters = useCallback(async () => {
    try {
      const [designationsRes, countriesRes] = await Promise.all([
        mastersAPI.getDesignations(),
        mastersAPI.getCountries().catch(() => ({ data: [] })),
      ])
      if (designationsRes?.data) setDesignations(designationsRes.data)
      if (countriesRes?.data) setCountries(countriesRes.data)
    } catch (error) {
      console.error('Failed to fetch masters:', error)
    }
  }, [])

  useEffect(() => { fetchCandidates() }, [fetchCandidates])
  useEffect(() => { fetchMasters() }, [fetchMasters])

  const handleOpenForm = (candidate?: Candidate) => {
    if (candidate) {
      setIsEditing(true)
      setSelectedCandidate(candidate)
      setFormData({
        first_name: candidate.firstName || '',
        last_name: candidate.lastName || '',
        email: candidate.email || '',
        contact_number: candidate.contactNumber || '',
        gender: '',
        dob: candidate.dob ? new Date(candidate.dob).toISOString().split('T')[0] : '',
        address: candidate.address || '',
        nationality: candidate.nationality || '',
        potential_country: '',
        designation: candidate.designationId ? String(candidate.designationId) : '',
        engagement_method: candidate.engagementMethod?.toLowerCase().replace('-', '_') || '',
        status: candidate.status,
      })
    } else {
      setIsEditing(false)
      setSelectedCandidate(null)
      setFormData({
        first_name: '', last_name: '', email: '', contact_number: '', gender: '',
        dob: '', address: '', nationality: '', potential_country: '', designation: '',
        engagement_method: '', status: true,
      })
    }
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!formData.first_name || !formData.email) {
      setError('First name and email are required')
      return
    }

    try {
      setSaving(true)
      setError('')

      const payload = { ...formData }

      if (isEditing && selectedCandidate) {
        await candidatesAPI.update(selectedCandidate.id, payload)
        setSuccess('Candidate updated successfully!')
      } else {
        await candidatesAPI.create(payload)
        setSuccess('Candidate created successfully!')
      }

      setFormOpen(false)
      fetchCandidates()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save candidate')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedCandidate) return

    try {
      await candidatesAPI.delete(selectedCandidate.id)
      setDeleteDialogOpen(false)
      setSelectedCandidate(null)
      setSuccess('Candidate deleted successfully!')
      fetchCandidates()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete candidate')
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Candidates</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage potential candidates for recruitment</p>
          </div>
          <Button onClick={() => handleOpenForm()} className="bg-[#1e3a5f] hover:bg-[#163050]">
            <Plus className="w-4 h-4 mr-2" />
            Add Candidate
          </Button>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-red-600">&times;</button>
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
                  <p className="text-sm text-gray-500">Total Candidates</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <UserPlus className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {candidates.filter(c => c.status).length}
                  </p>
                  <p className="text-sm text-gray-500">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Briefcase className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {new Set(candidates.map(c => c.designation)).size}
                  </p>
                  <p className="text-sm text-gray-500">Designations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="Search candidates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </div>
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v === "all" ? undefined : v)
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => { setSearch(''); setStatusFilter(''); }}>
                <RefreshCw className="w-4 h-4 mr-2" />Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
              </div>
            ) : candidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Users className="w-16 h-16 mb-4 text-gray-300" />
                <p className="text-lg font-medium">No candidates found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((candidate) => (
                    <TableRow key={candidate.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{candidate.fullName}</p>
                          <p className="text-xs text-gray-500">{candidate.nationality || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-300">{candidate.email}</span>
                          </div>
                          {candidate.contactNumber && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-300">{candidate.contactNumber}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{candidate.designation}</TableCell>
                      <TableCell>{candidate.engagementMethod}</TableCell>
                      <TableCell>
                        <Badge className={candidate.status ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {candidate.status ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/employees/new?candidate_id=${candidate.id}`}>
                                <UserPlus className="w-4 h-4 mr-2" />Convert to Employee
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/candidates/${candidate.id}`}>
                                <Eye className="w-4 h-4 mr-2" />View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenForm(candidate)}>
                              <Pencil className="w-4 h-4 mr-2" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedCandidate(candidate); setDeleteDialogOpen(true); }} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Form Sheet */}
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{isEditing ? 'Edit Candidate' : 'Add Candidate'}</SheetTitle>
            <SheetDescription>{isEditing ? 'Update candidate information' : 'Add a new potential candidate'}</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name <span className="text-red-500">*</span></Label>
                <Input value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email <span className="text-red-500">*</span></Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formData.contact_number} onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{GENDER_OPTIONS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Nationality</Label>
                <Input value={formData.nationality} onChange={(e) => setFormData({ ...formData, nationality: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Designation</Label>
                <Select value={formData.designation} onValueChange={(v) => setFormData({ ...formData, designation: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {designations.map((d: any) => <SelectItem key={d.id} value={String(d.id)}>{d.designationName || d.designation_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Engagement Method</Label>
                <Select value={formData.engagement_method} onValueChange={(v) => setFormData({ ...formData, engagement_method: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{ENGAGEMENT_OPTIONS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={2} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formData.status} onCheckedChange={(v) => setFormData({ ...formData, status: v })} />
              <Label>Active</Label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setFormOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1 bg-[#1e3a5f] hover:bg-[#163050]">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Candidate</DialogTitle>
            <DialogDescription>Are you sure you want to delete {selectedCandidate?.fullName}? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
