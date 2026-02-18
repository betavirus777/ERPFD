"use client"

import React, { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { projectsAPI } from '@/lib/api'
import {
  ArrowLeft, Edit, Calendar, Users, DollarSign, Building2,
  FileText, Loader2, Clock, Target, CheckCircle2, AlertTriangle,
  Briefcase, TrendingUp
} from 'lucide-react'
import { ProjectTasks } from '@/components/projects/ProjectTasks'
import { usePermission } from '@/hooks/usePermission'

interface Project {
  id: number
  projectCode: string
  projectName: string
  clientName: string
  clientId: number
  vendorName: string
  vendorId: number
  startDate: string
  endDate: string
  projectValue: number
  currency: string
  statusId: number
  statusName: string
  progress: number
  description: string
  projectManager: string
  teamSize: number
  milestones: any[]
  tasks: any[]
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  'Planning': 'bg-blue-100 text-blue-800',
  'In Progress': 'bg-yellow-100 text-yellow-800',
  'On Hold': 'bg-orange-100 text-orange-800',
  'Completed': 'bg-green-100 text-green-800',
  'Cancelled': 'bg-red-100 text-red-800',
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const { can, PERMISSIONS } = usePermission()

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await projectsAPI.getById(parseInt(id))
        if (response?.data) {
          setProject(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch project:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [id])

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount || 0)
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

  if (!project) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <p className="text-lg text-gray-500">Project not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/projects')}>
            Back to Projects
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
          <Button variant="ghost" size="icon" onClick={() => router.push('/projects')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {project.projectName}
              </h1>
              <Badge className={STATUS_COLORS[project.statusName] || 'bg-gray-100'}>
                {project.statusName}
              </Badge>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {project.projectCode}
            </p>
          </div>
          {can(PERMISSIONS.PROJECT_EDIT) && (
            <Button onClick={() => router.push(`/projects/${id}/edit`)} className="bg-[#1e3a5f] hover:bg-[#163050]">
              <Edit className="w-4 h-4 mr-2" />
              Edit Project
            </Button>
          )}
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Client</p>
                  <p className="font-medium">{project.clientName || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Project Value</p>
                  <p className="font-medium">{formatCurrency(project.projectValue, project.currency)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Timeline</p>
                  <p className="font-medium text-sm">{formatDate(project.startDate)} - {formatDate(project.endDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Progress</p>
                  <p className="font-medium">{project.progress || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Project Progress</span>
              <span className="text-sm text-gray-500">{project.progress || 0}%</span>
            </div>
            <Progress value={project.progress || 0} className="h-2" />
          </CardContent>
        </Card>

        {/* Details Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Project Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Project Code</p>
                      <p className="font-medium">{project.projectCode}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                      <Badge className={STATUS_COLORS[project.statusName] || 'bg-gray-100'}>
                        {project.statusName}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Start Date</p>
                      <p className="font-medium">{formatDate(project.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">End Date</p>
                      <p className="font-medium">{formatDate(project.endDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Project Manager</p>
                      <p className="font-medium">{project.projectManager || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Team Size</p>
                      <p className="font-medium">{project.teamSize || 0} members</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Client & Vendor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Client</p>
                    <p className="font-medium">{project.clientName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Vendor / Partner</p>
                    <p className="font-medium">{project.vendorName || '-'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {project.description || 'No description provided.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="milestones" className="mt-4">
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Milestones management coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="mt-4">
            <ProjectTasks projectId={parseInt(id)} />
          </TabsContent>

          <TabsContent value="team" className="mt-4">
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Team management coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Document management coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}

