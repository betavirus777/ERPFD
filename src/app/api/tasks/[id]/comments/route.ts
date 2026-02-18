import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { apiResponse, apiError, APIError } from '@/lib/api-response';
import { HttpStatus } from '@/lib/constants';
import { checkRateLimit, RateLimits } from '@/lib/rate-limit';

const commentSchema = z.object({
    comment: z.string().min(1).max(5000),
});

/**
 * GET /api/tasks/[id]/comments
 * Get all comments for a task
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!checkRateLimit(request, RateLimits.API_READ.limit)) {
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

        const comments = await prisma.taskComment.findMany({
            where: {
                task_id: taskId,
                deleted_at: null,
            },
            include: {
                author: {
                    select: {
                        uid: true,
                        first_name: true,
                        last_name: true,
                        employee_photo: true,
                    },
                },
            },
            orderBy: { created_at: 'desc' },
        });

        return apiResponse(comments, HttpStatus.OK);
    } catch (error) {
        return apiError(error);
    }
}

/**
 * POST /api/tasks/[id]/comments
 * Add a comment to a task
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
        const validated = commentSchema.parse(body);

        const comment = await prisma.taskComment.create({
            data: {
                task_id: taskId,
                comment: validated.comment,
                created_by: user.employeeId!, // Using integer ID
            },
            include: {
                author: {
                    select: {
                        id: true,
                        uid: true,
                        first_name: true,
                        last_name: true,
                        employee_photo: true,
                    },
                },
            },
        });

        // Log activity
        await prisma.taskActivity.create({
            data: {
                task_id: taskId,
                action: 'comment_added',
                new_value: validated.comment.substring(0, 100),
                performed_by: user.employeeId!, // Using integer ID
            },
        });

        return apiResponse(comment, HttpStatus.CREATED);
    } catch (error) {
        return apiError(error);
    }
}
