import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { apiResponse, apiError, APIError } from '@/lib/api-response';
import { HttpStatus } from '@/lib/constants';
import { checkRateLimit, RateLimits } from '@/lib/rate-limit';

const submitSchema = z.object({
    timesheet_ids: z.array(z.number()),
});

/**
 * POST /api/timesheets/submit
 * Submit timesheets for approval
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
        const validated = submitSchema.parse(body);

        // Get employee ID
        const employee = await prisma.employeeOnboarding.findFirst({
            where: { uid: user.employeeUid },
            select: { id: true }
        });

        if (!employee) {
            throw APIError.unauthorized();
        }

        // Verify all timesheets belong to user
        const timesheets = await prisma.timesheet.findMany({
            where: {
                id: { in: validated.timesheet_ids },
                employee_id: employee.id, // Use Int ID
                status: 'DRAFT',
                deleted_at: null,
            },
        });

        if (timesheets.length !== validated.timesheet_ids.length) {
            throw APIError.badRequest('Some timesheets are invalid or already submitted');
        }

        // Update all to submitted
        await prisma.timesheet.updateMany({
            where: {
                id: { in: validated.timesheet_ids },
            },
            data: {
                status: 'SUBMITTED',
                submitted_at: new Date(),
            },
        });

        return apiResponse(
            { message: `${timesheets.length} timesheet(s) submitted successfully` },
            HttpStatus.OK
        );
    } catch (error) {
        return apiError(error);
    }
}
