import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { apiResponse, apiError, APIError } from '@/lib/api-response';
import { HttpStatus } from '@/lib/constants';
import { checkRateLimit, RateLimits } from '@/lib/rate-limit';

const assignSchema = z.object({
    assigned_to: z.string().nullable(),
});

/**
 * POST /api/tasks/[id]/assign
 * Assign or unassign a task
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!checkRateLimit(request, RateLimits.API_WRITE.limit)) {
            throw APIError.rateLimitExceeded();
        }

        const user = await getUserFromRequest(request);
        if (!user) {
            throw APIError.unauthorized();
        }

        const { id } = await params;
        const taskId = parseInt(id);

        if (isNaN(taskId)) {
            throw APIError.badRequest('Invalid task ID');
        }

        const body = await request.json();
        const validated = assignSchema.parse(body);

        // Get current assignment
        const currentTask = await prisma.task.findUnique({
            where: { id: taskId },
            select: { assigned_to: true },
        });

        let assigneeId: number | null = null;
        if (validated.assigned_to) {
            const assignee = await prisma.employeeOnboarding.findFirst({
                where: { uid: validated.assigned_to },
                select: { id: true }
            });
            if (!assignee) {
                throw APIError.badRequest('Invalid assignee ID');
            }
            assigneeId = assignee.id;
        }

        // Update assignment
        const task = await prisma.task.update({
            where: { id: taskId },
            data: {
                assigned_to: assigneeId, // Use Int ID or null
            },
            include: {
                assignee: {
                    select: {
                        uid: true,
                        first_name: true,
                        last_name: true,
                        employee_photo: true,
                    },
                },
                taskStatus: true,
                priority: true,
            },
        });

        // Log activity
        await prisma.taskActivity.create({
            data: {
                task_id: taskId,
                action: validated.assigned_to ? 'assigned' : 'unassigned',
                field_changed: 'assigned_to',
                old_value: currentTask?.assigned_to ? String(currentTask.assigned_to) : null,
                new_value: validated.assigned_to,
                performed_by: (await prisma.employeeOnboarding.findFirst({
                    where: { uid: user.employeeUid },
                    select: { id: true }
                }))?.id || 0,
            },
        });

        return apiResponse(task, HttpStatus.OK);
    } catch (error) {
        return apiError(error);
    }
}
