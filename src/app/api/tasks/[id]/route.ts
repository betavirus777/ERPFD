import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { apiResponse, apiError, APIError } from '@/lib/api-response';
import { HttpStatus } from '@/lib/constants';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

// Validation schema for update (all optional)
const taskUpdateSchema = z.object({
    title: z.string().min(3).max(255).optional(),
    description: z.string().optional(),
    assigned_to: z.number().int().optional(),
    status_id: z.number().int().positive().optional(),
    priority_id: z.number().int().positive().optional(),
    estimated_hours: z.number().positive().optional(),
    start_date: z.string().or(z.date()).optional(),
    due_date: z.string().or(z.date()).optional(),
});

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) throw APIError.unauthorized();

        if (!(await hasPermission(user, PERMISSIONS.PROJECT_EDIT))) {
            throw APIError.forbidden('You do not have permission to edit tasks');
        }

        const { id } = await params;
        const taskId = parseInt(id);
        if (isNaN(taskId)) throw APIError.badRequest('Invalid task ID');

        const body = await request.json();
        const validated = taskUpdateSchema.parse(body);

        // Check if task exists
        const existingTask = await prisma.task.findUnique({
            where: { id: taskId }
        });

        if (!existingTask) throw APIError.notFound('Task not found');

        // Update task
        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: {
                title: validated.title,
                description: validated.description,
                assigned_to: validated.assigned_to,
                status_id: validated.status_id,
                priority_id: validated.priority_id,
                estimated_hours: validated.estimated_hours,
                start_date: validated.start_date ? new Date(validated.start_date) : undefined,
                due_date: validated.due_date ? new Date(validated.due_date) : undefined,
            },
        });

        // Log activity
        await prisma.taskActivity.create({
            data: {
                task_id: taskId,
                action: 'updated',
                performed_by: user.employeeId!,
            }
        });

        return apiResponse(updatedTask);
    } catch (error) {
        return apiError(error);
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) throw APIError.unauthorized();

        if (!(await hasPermission(user, PERMISSIONS.PROJECT_EDIT))) {
            throw APIError.forbidden('You do not have permission to delete tasks');
        }

        const { id } = await params;
        const taskId = parseInt(id);
        if (isNaN(taskId)) throw APIError.badRequest('Invalid task ID');

        await prisma.task.update({
            where: { id: taskId },
            data: { deleted_at: new Date() }
        });

        return apiResponse({ message: 'Task deleted successfully' });
    } catch (error) {
        return apiError(error);
    }
}
