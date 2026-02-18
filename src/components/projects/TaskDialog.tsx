"use client"

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

const taskFormSchema = z.object({
    title: z.string().min(3, 'Title is required'),
    description: z.string().optional(),
    status_id: z.string().min(1, 'Status is required'),
    priority_id: z.string().min(1, 'Priority is required'),
    assigned_to: z.string().optional(),
    start_date: z.string().optional(),
    due_date: z.string().optional(),
    estimated_hours: z.string().optional(),
})

type TaskFormData = z.infer<typeof taskFormSchema>

interface TaskDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    task?: any // Edit mode if provided
    projectId: number
    meta: { statuses: any[], priorities: any[], employees: any[] }
    onSave: (data: any) => Promise<void>
}

export function TaskDialog({ open, onOpenChange, task, projectId, meta, onSave }: TaskDialogProps) {
    const [isSaving, setIsSaving] = React.useState(false)

    const form = useForm<TaskFormData>({
        resolver: zodResolver(taskFormSchema),
        defaultValues: {
            title: '',
            description: '',
            status_id: '',
            priority_id: '',
            assigned_to: '0',
            start_date: '',
            due_date: '',
            estimated_hours: '',
        },
    })

    useEffect(() => {
        if (open) {
            if (task) {
                form.reset({
                    title: task.title,
                    description: task.description || '',
                    status_id: task.status_id?.toString() || '',
                    priority_id: task.priority_id?.toString() || '',
                    assigned_to: task.assigned_to?.toString() || '0',
                    start_date: task.start_date ? new Date(task.start_date).toISOString().split('T')[0] : '',
                    due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
                    estimated_hours: task.estimated_hours?.toString() || '',
                })
            } else {
                form.reset({
                    title: '',
                    description: '',
                    status_id: meta.statuses[0]?.id?.toString() || '',
                    priority_id: meta.priorities.find((p: any) => p.name === 'Medium')?.id?.toString() || meta.priorities[0]?.id?.toString() || '',
                    assigned_to: '0',
                    start_date: '',
                    due_date: '',
                    estimated_hours: '',
                })
            }
        }
    }, [open, task, meta])

    const onSubmit = async (data: TaskFormData) => {
        try {
            setIsSaving(true)
            const payload: any = {
                ...data,
                project_id: projectId,
                status_id: parseInt(data.status_id),
                priority_id: parseInt(data.priority_id),
                assigned_to: data.assigned_to && data.assigned_to !== '0' ? parseInt(data.assigned_to) : undefined,
                estimated_hours: data.estimated_hours ? parseFloat(data.estimated_hours) : undefined,
            }

            await onSave(payload)
            onOpenChange(false)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{task ? 'Edit Task' : 'Create Task'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Task Title *</Label>
                        <Input id="title" {...form.register('title')} placeholder="e.g. Implement Login Page" />
                        {form.formState.errors.title && <p className="text-red-500 text-xs">{form.formState.errors.title.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">Status *</Label>
                            <Select
                                value={form.watch('status_id')}
                                onValueChange={(val) => form.setValue('status_id', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {meta.statuses.map((s) => (
                                        <SelectItem key={s.id} value={s.id.toString()}>
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.formState.errors.status_id && <p className="text-red-500 text-xs">{form.formState.errors.status_id.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority *</Label>
                            <Select
                                value={form.watch('priority_id')}
                                onValueChange={(val) => form.setValue('priority_id', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    {meta.priorities.map((p) => (
                                        <SelectItem key={p.id} value={p.id.toString()}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="assignee">Assignee</Label>
                        <Select
                            value={form.watch('assigned_to')}
                            onValueChange={(val) => form.setValue('assigned_to', val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Unassigned" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Unassigned</SelectItem>
                                {meta.employees.map((e) => (
                                    <SelectItem key={e.id} value={e.id.toString()}>
                                        {e.first_name} {e.last_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Start Date</Label>
                            <Input type="date" id="start_date" {...form.register('start_date')} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="due_date">Due Date</Label>
                            <Input type="date" id="due_date" {...form.register('due_date')} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hours">Est. Hours</Label>
                            <Input type="number" step="0.1" id="hours" {...form.register('estimated_hours')} placeholder="0.0" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            className="resize-none min-h-[100px]"
                            {...form.register('description')}
                            placeholder="Task details..."
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Task
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
