"use client"

import React, { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { candidatesAPI } from '@/lib/api'
import { 
  ArrowLeft, Edit, Mail, Phone, MapPin, Briefcase, Calendar, 
  FileText, Loader2, User, GraduationCap, Award, DollarSign,
  Globe, Linkedin, ExternalLink
} from 'lucide-react'

interface Candidate {
  id: number
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
  status: string
  statusName: string
  source: string
  resumeUrl: string
  linkedinUrl: string
  skills: string
  education: string
  notes: string
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  'New': 'bg-blue-100 text-blue-800',
  'Screening': 'bg-yellow-100 text-yellow-800',
  'Interview': 'bg-purple-100 text-purple-800',
  'Offer': 'bg-green-100 text-green-800',
  'Hired': 'bg-emerald-100 text-emerald-800',
  'Rejected': 'bg-red-100 text-red-800',
}

export default function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        const response = await candidatesAPI.getById(parseInt(id))
        if (response?.data) {
          setCandidate(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch candidate:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCandidate()
  }, [id])

  const getInitials = (name: string) => {
    if (!name) return 'C'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
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

  if (!candidate) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <p className="text-lg text-gray-500">Candidate not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/candidates')}>
            Back to Candidates
          </Button>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/candidates')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Candidate Details
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              View candidate information and history
            </p>
          </div>
          <Button onClick={() => router.push(`/candidates/${id}/edit`)} className="bg-[#1e3a5f] hover:bg-[#163050]">
            <Edit className="w-4 h-4 mr-2" />
            Edit Candidate
          </Button>
        </div>

        {/* Profile Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="bg-[#1e3a5f] text-white text-2xl">
                  {getInitials(candidate.candidateName)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {candidate.candidateName}
                    </h2>
                    <p className="text-lg text-[#1e3a5f] dark:text-blue-400 font-medium">
                      {candidate.position}
                    </p>
                    <p className="text-gray-500">{candidate.currentCompany}</p>
                  </div>
                  <Badge className={STATUS_COLORS[candidate.statusName] || 'bg-gray-100'}>
                    {candidate.statusName}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm truncate">{candidate.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{candidate.phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{candidate.location || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Briefcase className="w-4 h-4" />
                    <span className="text-sm">{candidate.experience || '-'} experience</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Tabs */}
        <Tabs defaultValue="details">
          <TabsList className="bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Professional Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Professional Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Current Company</p>
                      <p className="font-medium">{candidate.currentCompany || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Experience</p>
                      <p className="font-medium">{candidate.experience || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Current Salary</p>
                      <p className="font-medium">{candidate.currentSalary || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Expected Salary</p>
                      <p className="font-medium">{candidate.expectedSalary || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Notice Period</p>
                      <p className="font-medium">{candidate.noticePeriod || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Source</p>
                      <p className="font-medium">{candidate.source || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Skills & Education */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    Skills & Education
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills ? candidate.skills.split(',').map((skill, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {skill.trim()}
                        </Badge>
                      )) : <span className="text-gray-400">-</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Education</p>
                    <p className="font-medium">{candidate.education || '-'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Links & Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {candidate.resumeUrl && (
                    <a 
                      href={candidate.resumeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      <FileText className="w-4 h-4" />
                      View Resume
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {candidate.linkedinUrl && (
                    <a 
                      href={candidate.linkedinUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      <Linkedin className="w-4 h-4" />
                      LinkedIn Profile
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {candidate.notes || 'No notes added.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Document management coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Interview history and status changes coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}

