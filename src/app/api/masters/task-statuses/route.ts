import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { apiResponse, apiError, APIError } from '@/lib/api-response';
import { HttpStatus, CacheDuration } from '@/lib/constants';
import { checkRateLimit, RateLimits } from '@/lib/rate-limit';
import { withCache } from '@/lib/api-response';

/**
 * GET /api/masters/task-statuses
 * Get all task statuses
 */
export async function GET(request: NextRequest) {
    try {
        if (!checkRateLimit(request, RateLimits.API_MASTER.limit)) {
            throw APIError.rateLimitExceeded();
        }

        const user = await getUserFromRequest(request);
        if (!user) {
            throw APIError.unauthorized();
        }

        const statuses = await prisma.taskStatus.findMany({
            where: { status: true },
            orderBy: { order: 'asc' },
        });

        const response = apiResponse(statuses, HttpStatus.OK);
        return withCache(response, CacheDuration.MEDIUM);
    } catch (error) {
        return apiError(error);
    }
}
