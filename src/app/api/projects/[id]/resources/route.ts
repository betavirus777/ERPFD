import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { apiResponse, apiError, APIError } from '@/lib/api-response';
import { HttpStatus } from '@/lib/constants';
import { checkRateLimit, RateLimits } from '@/lib/rate-limit';

const resourceSchema = z.object({
    employee_id: z.string(),
    allocation_percent: z.number().min(0).max(100),
    role_in_project: z.string().optional(),
    hourly_rate: z.number().positive().optional(),
    start_date: z.string().or(z.date()),
    end_date: z.string().or(z.date()).optional(),
});

/**
 * GET /api/projects/[id]/resources
 * Get all resources assigned to a project
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
        const projectId = parseInt(id);

        if (isNaN(projectId)) {
            throw APIError.badRequest('Invalid project ID');
        }

        const resources = await prisma.resourceAllocation.findMany({
            where: {
                project_id: projectId,
                deleted_at: null,
                status: true,
            },
            include: {
                employee: {
                    select: {
                        uid: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        employee_photo: true,
                        designation_master: {
                            select: {
                                designation_name: true,
                            },
                        },
                    },
                },
            },
            orderBy: { created_at: 'desc' },
        });

        return apiResponse(resources, HttpStatus.OK);
    } catch (error) {
        return apiError(error);
    }
}

/**
 * POST /api/projects/[id]/resources
 * Assign a resource to a project
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
        const projectId = parseInt(id);

        if (isNaN(projectId)) {
            throw APIError.badRequest('Invalid project ID');
        }

        const body = await request.json();
        const validated = resourceSchema.parse(body);

        // Check for overlapping allocation
        // First get employee ID from UID for the check
        const emp = await prisma.employeeOnboarding.findUnique({
            where: { uid: validated.employee_id },
            select: { id: true }
        });

        if (!emp) {
            throw APIError.badRequest('Invalid employee ID');
        }

        const existing = await prisma.resourceAllocation.findFirst({
            where: {
                project_id: projectId,
                employee_id: emp.id,
                start_date: new Date(validated.start_date),
                deleted_at: null,
            },
        });

        if (existing) {
            throw APIError.badRequest('Resource already allocated for this period');
        }

        // Create new allocation
        // First get employee ID from UID
        const employee = await prisma.employeeOnboarding.findFirst({
            where: { uid: validated.employee_id },
            select: { id: true }
        });

        if (!employee) {
            throw APIError.badRequest('Invalid employee ID');
        }

        const allocation = await prisma.resourceAllocation.create({
            data: {
                project_id: projectId,
                employee_id: employee.id, // Use Int ID
                allocation_percent: validated.allocation_percent,
                role_in_project: validated.role_in_project,
                hourly_rate: validated.hourly_rate,
                start_date: new Date(validated.start_date),
                end_date: validated.end_date ? new Date(validated.end_date) : null,
                // Need current user ID for created_by
                created_by: (await prisma.employeeOnboarding.findFirst({
                    where: { uid: user.employeeUid },
                    select: { id: true }
                }))?.id || 0, // Fallback if not found, but should ensure valid user
            },
            include: {
                employee: {
                    select: {
                        uid: true,
                        first_name: true,
                        last_name: true,
                        employee_photo: true,
                    },
                },
            },
        });

        return apiResponse(allocation, HttpStatus.CREATED);
    } catch (error) {
        return apiError(error);
    }
}
