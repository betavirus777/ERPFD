import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { apiResponse, apiError, APIError } from '@/lib/api-response';
import { HttpStatus } from '@/lib/constants';
import { checkRateLimit, RateLimits } from '@/lib/rate-limit';

/**
 * GET /api/timesheets
 * Get timesheets for the logged-in user
 */
export async function GET(request: NextRequest) {
    try {
        if (!checkRateLimit(request, RateLimits.API_READ.limit)) {
            throw APIError.rateLimitExceeded();
        }

        const user = await getUserFromRequest(request);
        if (!user) {
            throw APIError.unauthorized();
        }

        const { searchParams } = new URL(request.url);
        const start_date = searchParams.get('start_date');
        const end_date = searchParams.get('end_date');
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        // Lookup employee ID
        const employee = await prisma.employeeOnboarding.findFirst({
            where: { uid: user.employeeUid },
            select: { id: true }
        });

        if (!employee) {
            throw APIError.unauthorized(); // Should verifyToken handle this? Maybe, but safe here.
        }

        const where: any = {
            employee_id: employee.id, // Use Int ID
            deleted_at: null,
        };

        if (start_date && end_date) {
            where.work_date = {
                gte: new Date(start_date),
                lte: new Date(end_date),
            };
        }

        if (status) {
            where.status = status;
        }

        const [timesheets, total] = await Promise.all([
            prisma.timesheet.findMany({
                where,
                include: {
                    project: {
                        select: {
                            id: true,
                            project_name: true,
                        },
                    },
                    task: {
                        select: {
                            id: true,
                            task_code: true,
                            title: true,
                        },
                    },
                    approver: {
                        select: {
                            uid: true,
                            first_name: true,
                            last_name: true,
                        },
                    },
                },
                orderBy: { work_date: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.timesheet.count({ where }),
        ]);

        return apiResponse(
            timesheets,
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
 * POST /api/timesheets
 * Create or update timesheet entry
 */
export async function POST(request: NextRequest) {
    try {
        if (!checkRateLimit(request, RateLimits.API_WRITE.limit)) {
            throw APIError.rateLimitExceeded();
        }

        const user = await getUserFromRequest(request);
        if (!user) {
            throw APIError.unauthorized();
        }

        const body = await request.json();
        const { project_id, task_id, work_date, hours, description, is_billable } = body;

        // Generate entry code
        const date = new Date(work_date);
        const entry_code = `TS-${user.employeeUid}-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${Date.now()}`;

        // Lookup employee ID
        const employee = await prisma.employeeOnboarding.findUnique({
            where: { uid: user.employeeUid },
            select: { id: true }
        });

        if (!employee) {
            throw APIError.unauthorized();
        }

        // Check for existing entry
        const existing = await prisma.timesheet.findFirst({
            where: {
                employee_id: employee.id,
                project_id,
                task_id: task_id || null,
                work_date: new Date(work_date),
                deleted_at: null,
            },
        });

        let timesheet;

        if (existing) {
            // Update existing
            timesheet = await prisma.timesheet.update({
                where: { id: existing.id },
                data: {
                    hours,
                    description,
                    is_billable: is_billable ?? true,
                },
                include: {
                    project: true,
                    task: true,
                },
            });
        } else {
            // Create new
            timesheet = await prisma.timesheet.create({
                data: {
                    entry_code,
                    employee_id: employee.id, // Use Int ID
                    project_id,
                    task_id: task_id || null,
                    work_date: new Date(work_date),
                    hours,
                    description,
                    is_billable: is_billable ?? true,
                    status: 'DRAFT',
                },
                include: {
                    project: true,
                    task: true,
                },
            });
        }

        return apiResponse(timesheet, existing ? HttpStatus.OK : HttpStatus.CREATED);
    } catch (error) {
        return apiError(error);
    }
}
