import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { apiResponse, apiError, APIError } from '@/lib/api-response';
import { HttpStatus } from '@/lib/constants';
import { checkRateLimit, RateLimits } from '@/lib/rate-limit';

const approvalSchema = z.object({
    timesheet_id: z.number(),
    action: z.enum(['approve', 'reject']),
    rejection_reason: z.string().optional(),
});

/**
 * POST /api/timesheets/approve
 * Approve or reject timesheet (Manager only)
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

        // TODO: Add permission check for manager role
        // if (!hasPermission(user, 'approve_timesheet')) {
        //   throw APIError.forbidden();
        // }

        const body = await request.json();
        const validated = approvalSchema.parse(body);

        const timesheet = await prisma.timesheet.findUnique({
            where: { id: validated.timesheet_id },
        });

        if (!timesheet || timesheet.deleted_at) {
            throw APIError.notFound('Timesheet not found');
        }

        if (timesheet.status !== 'SUBMITTED') {
            throw APIError.badRequest('Timesheet is not in submitted state');
        }

        // Get approver ID
        const approver = await prisma.employeeOnboarding.findFirst({
            where: { uid: user.employeeUid },
            select: { id: true }
        });

        if (!approver) {
            throw APIError.unauthorized();
        }

        if (validated.action === 'approve') {
            await prisma.timesheet.update({
                where: { id: validated.timesheet_id },
                data: {
                    status: 'APPROVED',
                    approved_at: new Date(),
                    approved_by: approver.id, // Use Int ID
                },
            });

            return apiResponse({ message: 'Timesheet approved successfully' }, HttpStatus.OK);
        } else {
            if (!validated.rejection_reason) {
                throw APIError.badRequest('Rejection reason is required');
            }

            await prisma.timesheet.update({
                where: { id: validated.timesheet_id },
                data: {
                    status: 'REJECTED',
                    rejected_at: new Date(),
                    approved_by: approver.id, // Use Int ID (approved_by is reused for rejected_by logic often, or check schema)
                    rejection_reason: validated.rejection_reason,
                },
            });

            return apiResponse({ message: 'Timesheet rejected' }, HttpStatus.OK);
        }
    } catch (error) {
        return apiError(error);
    }
}
