import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { apiResponse, apiError, APIError } from '@/lib/api-response';
import { HttpStatus } from '@/lib/constants';
import { checkRateLimit, RateLimits } from '@/lib/rate-limit';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

// Task creation/update schema
const taskSchema = z.object({
    title: z.string().min(3).max(255),
    description: z.string().optional(),
    assigned_to: z.number().int().optional(),
    status_id: z.number().int().positive(),
    priority_id: z.number().int().positive().optional(),
    estimated_hours: z.number().positive().optional(),
    start_date: z.string().or(z.date()).optional(),
    due_date: z.string().or(z.date()).optional(),
    parent_id: z.number().int().positive().optional(),
});

/**
 * GET /api/projects/[id]/tasks
 * List all tasks for a project with filtering
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Rate limiting
        if (!checkRateLimit(request, RateLimits.API_READ.limit)) {
            throw APIError.rateLimitExceeded();
        }

        const user = await getUserFromRequest(request);
        if (!user) {
            throw APIError.unauthorized();
        }

        if (!(await hasPermission(user, PERMISSIONS.PROJECT_VIEW))) {
            throw APIError.forbidden('You do not have permission to view project tasks');
        }

        const { id } = await params;
        const projectId = parseInt(id);

        if (isNaN(projectId)) {
            throw APIError.badRequest('Invalid project ID');
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const status_id = searchParams.get('status_id');
        const assigned_to = searchParams.get('assigned_to');
        const priority_id = searchParams.get('priority_id');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        // Build where clause
        const where: any = {
            project_id: projectId,
            deleted_at: null,
        };

        if (status_id) where.status_id = parseInt(status_id);
        if (assigned_to) where.assigned_to = parseInt(assigned_to);
        if (priority_id) where.priority_id = parseInt(priority_id);
        if (search) {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } },
                { task_code: { contains: search } },
            ];
        }

        // Fetch tasks with pagination
        const [tasks, total] = await Promise.all([
            prisma.task.findMany({
                where,
                include: {
                    assignee: {
                        select: {
                            id: true,
                            uid: true,
                            first_name: true,
                            last_name: true,
                            employee_photo: true,
                        },
                    },
                    creator: {
                        select: {
                            id: true,
                            uid: true,
                            first_name: true,
                            last_name: true,
                        },
                    },
                    taskStatus: true,
                    priority: true,
                    _count: {
                        select: {
                            comments: true,
                            attachments: true,
                            subtasks: true,
                        },
                    },
                },
                orderBy: [
                    { priority: { order: 'desc' } },
                    { due_date: 'asc' },
                    { created_at: 'desc' },
                ],
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.task.count({ where }),
        ]);

        return apiResponse(
            tasks,
            HttpStatus.OK,
            {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }
        );
    } catch (error) {
        return apiError(error);
    }
}

/**
 * POST /api/projects/[id]/tasks
 * Create a new task
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Rate limiting
        if (!checkRateLimit(request, RateLimits.API_WRITE.limit)) {
            throw APIError.rateLimitExceeded();
        }

        const user = await getUserFromRequest(request);
        if (!user) {
            throw APIError.unauthorized();
        }

        if (!(await hasPermission(user, PERMISSIONS.PROJECT_EDIT))) {
            throw APIError.forbidden('You do not have permission to create tasks');
        }

        const { id } = await params;
        const projectId = parseInt(id);

        if (isNaN(projectId)) {
            throw APIError.badRequest('Invalid project ID');
        }

        // Validate input
        const body = await request.json();
        const validated = taskSchema.parse(body);

        // Generate task code
        const taskCount = await prisma.task.count({
            where: { project_id: projectId },
        });
        const task_code = `TASK-${projectId}-${(taskCount + 1).toString().padStart(4, '0')}`;

        // Create task
        const task = await prisma.task.create({
            data: {
                task_code,
                project_id: projectId,
                title: validated.title,
                description: validated.description,
                assigned_to: validated.assigned_to,
                status_id: validated.status_id,
                priority_id: validated.priority_id,
                estimated_hours: validated.estimated_hours,
                start_date: validated.start_date ? new Date(validated.start_date) : null,
                due_date: validated.due_date ? new Date(validated.due_date) : null,
                parent_id: validated.parent_id,
                created_by: user.employeeId!, // Using integer ID
            },
            include: {
                assignee: {
                    select: {
                        id: true,
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
                task_id: task.id,
                action: 'created',
                new_value: 'Task created',
                performed_by: user.employeeId!,
            },
        });

        return apiResponse(task, HttpStatus.CREATED);
    } catch (error) {
        return apiError(error);
    }
}
