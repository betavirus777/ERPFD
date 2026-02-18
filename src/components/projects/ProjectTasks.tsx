"use client"

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Edit, Trash2, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { TaskDialog } from './TaskDialog'
import { toast } from '@/components/ui/use-toast'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { usePermission } from '@/hooks/usePermission'

interface ProjectTasksProps {
    projectId: number
}

// Helper to get initials
const getInitials = (first: string, last: string) => {
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase()
}

export function ProjectTasks({ projectId }: ProjectTasksProps) {
    const [tasks, setTasks] = useState<any[]>([])
    const [meta, setMeta] = useState<{ statuses: any[], priorities: any[], employees: any[] }>({ statuses: [], priorities: [], employees: [] })
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingTask, setEditingTask] = useState<any | null>(null)
    const { can, PERMISSIONS } = usePermission()

    const fetchData = async () => {
        try {
            setLoading(true)
            const [tasksRes, metaRes] = await Promise.all([
                axios.get(`/api/projects/${projectId}/tasks`),
                axios.get('/api/tasks/meta')
            ])

            if (tasksRes.data.success) {
                setTasks(tasksRes.data.data)
            }
            if (metaRes.data.success) {
                setMeta(metaRes.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch tasks", error)
            toast({ title: "Error", description: "Failed to load tasks", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (projectId) {
            fetchData()
        }
    }, [projectId])

    const handleSave = async (data: any) => {
        try {
            if (editingTask) {
                // Edit logic
                await axios.put(`/api/tasks/${editingTask.id}`, data) // Assuming this exists or I create it
                toast({ title: "Success", description: "Task updated" })
            } else {
                await axios.post(`/api/projects/${projectId}/tasks`, data)
                toast({ title: "Success", description: "Task created" })
            }
            fetchData()
        } catch (error: any) {
            toast({ title: "Error", description: error.response?.data?.error || "Failed to save task", variant: "destructive" })
            throw error // Rethrow for dialog to handle state
        }
    }

    const handleDelete = async (taskId: number) => {
        if (!confirm("Are you sure you want to delete this task?")) return;
        try {
            await axios.delete(`/api/tasks/${taskId}`)
            toast({ title: "Success", description: "Task deleted" })
            fetchData()
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete task", variant: "destructive" })
        }
    }

    const getStatusColor = (statusName: string) => {
        switch (statusName?.toLowerCase()) {
            case 'todo': return 'bg-gray-100 text-gray-800'
            case 'in progress': return 'bg-blue-100 text-blue-800'
            case 'completed': return 'bg-green-100 text-green-800'
            case 'review': return 'bg-purple-100 text-purple-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getPriorityColor = (priorityName: string) => {
        switch (priorityName?.toLowerCase()) {
            case 'high': return 'bg-red-100 text-red-800'
            case 'medium': return 'bg-yellow-100 text-yellow-800'
            case 'low': return 'bg-green-100 text-green-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    if (loading && tasks.length === 0) {
        return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Tasks ({tasks.length})</h3>
                {can(PERMISSIONS.PROJECT_EDIT) && (
                    <Button onClick={() => { setEditingTask(null); setDialogOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Task
                    </Button>
                )}
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Assignee</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tasks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                    No tasks found. Create one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            tasks.map((task) => (
                                <TableRow key={task.id}>
                                    <TableCell className="font-mono text-xs">{task.task_code}</TableCell>
                                    <TableCell className="font-medium">{task.title}</TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(task.taskStatus?.name)} variant="outline">
                                            {task.taskStatus?.name}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {task.priority && (
                                            <Badge className={getPriorityColor(task.priority.name)} variant="outline">
                                                {task.priority.name}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {task.assignee ? (
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={task.assignee.employee_photo} />
                                                    <AvatarFallback className="text-[10px]">
                                                        {getInitials(task.assignee.first_name, task.assignee.last_name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm">{task.assignee.first_name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-sm italic">Unassigned</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {can(PERMISSIONS.PROJECT_EDIT) && (
                                            <>
                                                <Button variant="ghost" size="icon" onClick={() => { setEditingTask(task); setDialogOpen(true); }}>
                                                    <Edit className="w-4 h-4 text-gray-500" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)}>
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            <TaskDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                task={editingTask}
                projectId={projectId}
                meta={meta}
                onSave={handleSave}
            />
        </div>
    )
}
