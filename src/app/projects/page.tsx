"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, FolderKanban, Users, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// import { mockProjects, delay } from '@/lib/mock-pm-data' // Disabled for now

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch('/api/projects')
        const data = await response.json()
        if (data.success) {
          setProjects(data.data)
        } else {
          console.error(data.error)
        }
      } catch (error) {
        console.error('Failed to load projects:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProjects()
  }, [])

  const filteredProjects = projects.filter(p =>
    p.project_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.project_code?.toLowerCase().includes(search.toLowerCase()) ||
    p.client?.client_name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your projects and track progress
          </p>
        </div>
        <Button onClick={() => router.push('/projects/create')}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => router.push(`/projects/${project.id}/tasks`)}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    {project.project_name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {project.project_code}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${project.status
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                  {project.status ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 min-h-[40px]">
                {project.project_description || 'No description'}
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-1" title="Tasks">
                  <FolderKanban className="w-4 h-4" />
                  <span>{project._count?.tasks || 0}</span>
                </div>
                <div className="flex items-center gap-1" title="Team Members">
                  <Users className="w-4 h-4" />
                  <span>{project._count?.resourceAllocations || 0}</span>
                </div>
                <div className="flex items-center gap-1" title="Time Logged">
                  <Clock className="w-4 h-4" />
                  <span>{project._count?.timesheets || 0}h</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[60%]">
                  {project.client?.client_name || 'No client'}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {project.status_master?.status || 'Active'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <FolderKanban className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No projects found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Try adjusting your search criteria
          </p>
        </div>
      )}

      {/* Demo Notice */}

    </div>
  )
}
