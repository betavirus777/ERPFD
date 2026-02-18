import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { apiResponse, apiError, APIError } from '@/lib/api-response';
import { HttpStatus, CacheDuration } from '@/lib/constants';
import { checkRateLimit, RateLimits } from '@/lib/rate-limit';
import { withCache } from '@/lib/api-response';

/**
 * GET /api/masters/task-priorities  
 * Get all task priorities
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

        const priorities = await prisma.taskPriority.findMany({
            where: { status: true },
            orderBy: { order: 'asc' },
        });

        const response = apiResponse(priorities, HttpStatus.OK);
        return withCache(response, CacheDuration.MEDIUM);
    } catch (error) {
        return apiError(error);
    }
}
