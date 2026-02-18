"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Search, Filter, MoreVertical, MessageSquare, Paperclip, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
// import {
//     mockTaskStatuses,
//     mockTasks,
//     getProjectById,
//     getTasksByProject,
//     getTasksByStatus,
//     delay
// } from '@/lib/mock-pm-data'

interface Task {
    id: number
    task_code: string
    title: string
    description: string
    status_id: number
    priority_id: number
    assignee: any
    priority: any
    taskStatus: any
    due_date: string
    estimated_hours: number
    _count: { comments: number; attachments: number }
}

export default function TaskBoardPage() {
    const params = useParams()
    const router = useRouter()
    const projectId = parseInt(params.id as string)

    const [tasks, setTasks] = useState<Task[]>([])
    const [statuses, setStatuses] = useState<any[]>([])

    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [draggedTask, setDraggedTask] = useState<Task | null>(null)
    const [project, setProject] = useState<any>(null)

    useEffect(() => {
        loadData()
    }, [projectId])

    const loadData = async () => {
        try {
            setLoading(true)
            const [projRes, tasksRes, statusRes] = await Promise.all([
                fetch(`/api/projects/${projectId}`),
                fetch(`/api/projects/${projectId}/tasks`),
                fetch('/api/masters/task-statuses')
            ])

            const projData = await projRes.json()
            const tasksData = await tasksRes.json()
            const statusData = await statusRes.json()

            if (projData.success) setProject(projData.data)
            if (tasksData.success) setTasks(tasksData.data)
            if (statusData.success) setStatuses(statusData.data)

        } catch (error) {
            console.error('Failed to load data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDragStart = (task: Task) => {
        setDraggedTask(task)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    const handleDrop = async (statusId: number) => {
        if (!draggedTask) return

        // Optimistic update
        const oldTasks = [...tasks]
        setTasks(prev => prev.map(task =>
            task.id === draggedTask.id
                ? { ...task, status_id: statusId, taskStatus: statuses.find(s => s.id === statusId) || task.taskStatus }
                : task
        ))
        setDraggedTask(null)

        try {
            const res = await fetch(`/api/tasks/${draggedTask.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status_id: statusId })
            })
            const data = await res.json()
            if (!data.success) {
                // Revert
                setTasks(oldTasks)
                console.error(data.error)
            }
        } catch (error) {
            setTasks(oldTasks)
            console.error(error)
        }
    }

    const getTasksByStatusId = (statusId: number) => {
        return tasks.filter(task =>
            task.status_id === statusId &&
            (search === '' ||
                task.title.toLowerCase().includes(search.toLowerCase()) ||
                task.task_code.toLowerCase().includes(search.toLowerCase()))
        )
    }

    const getPriorityBadge = (priority: any) => {
        if (!priority) return null
        return (
            <span
                className="px-2 py-0.5 text-xs font-medium rounded"
                style={{
                    backgroundColor: `${priority.color}20`,
                    color: priority.color
                }}
            >
                {priority.name}
            </span>
        )
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        const now = new Date()
        const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays < 0) return <span className="text-red-600">Overdue</span>
        if (diffDays === 0) return <span className="text-orange-600">Today</span>
        if (diffDays === 1) return <span className="text-orange-500">Tomorrow</span>

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!project) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Project not found</h3>
                    <Button onClick={() => router.push('/projects')}>Back to Projects</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/projects')}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.project_name}</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                {project.project_code} • {tasks.length} tasks
                            </p>
                        </div>
                    </div>
                    <Button onClick={() => alert('Create task feature - Coming soon!')}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Task
                    </Button>
                </div>

                {/* Search & Filters */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search tasks..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button variant="outline" size="sm">
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                    </Button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto p-6">
                <div className="flex gap-4 h-full min-w-max">
                    {statuses.map((status) => {
                        const statusTasks = getTasksByStatusId(status.id)

                        return (
                            <div
                                key={status.id}
                                className="flex flex-col w-80 bg-gray-100 dark:bg-gray-800 rounded-lg"
                                onDragOver={handleDragOver}
                                onDrop={() => handleDrop(status.id)}
                            >
                                {/* Column Header */}
                                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: status.color }}
                                        />
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            {status.name}
                                        </h3>
                                        <span className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                                            {statusTasks.length}
                                        </span>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Tasks */}
                                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                    {statusTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            draggable
                                            onDragStart={() => handleDragStart(task)}
                                            onClick={() => setSelectedTask(task)}
                                            className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-move group"
                                        >
                                            {/* Task Header */}
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    {getPriorityBadge(task.priority)}
                                                </div>
                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            {/* Task Title */}
                                            <h4 className="font-medium text-gray-900 dark:text-white mb-1 line-clamp-2">
                                                {task.title}
                                            </h4>

                                            {/* Task Code */}
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                                {task.task_code}
                                            </p>

                                            {/* Task Meta */}
                                            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                                                {/* Assignee */}
                                                {task.assignee ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                                                            {task.assignee.first_name[0]}{task.assignee.last_name[0]}
                                                        </div>
                                                        <span className="text-xs text-gray-600 dark:text-gray-400">
                                                            {task.assignee.first_name}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Unassigned</span>
                                                )}

                                                {/* Icons */}
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    {task._count.comments > 0 && (
                                                        <div className="flex items-center gap-1 text-xs">
                                                            <MessageSquare className="w-3.5 h-3.5" />
                                                            <span>{task._count.comments}</span>
                                                        </div>
                                                    )}
                                                    {task._count.attachments > 0 && (
                                                        <div className="flex items-center gap-1 text-xs">
                                                            <Paperclip className="w-3.5 h-3.5" />
                                                            <span>{task._count.attachments}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Due Date */}
                                            {task.due_date && (
                                                <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(task.due_date)}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {statusTasks.length === 0 && (
                                        <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                                            No tasks
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Demo Notice */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800 px-6 py-3">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                    <strong>Demo Mode:</strong> Drag & drop tasks to change status. Changes are temporary (in-memory only).
                </p>
            </div>
        </div>
    )
}
