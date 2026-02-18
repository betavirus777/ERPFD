import { LRUCache } from 'lru-cache';
import { NextRequest } from 'next/server';

interface RateLimitOptions {
    interval: number; // Time window in milliseconds
    uniqueTokenPerInterval: number; // Max number of unique tokens
}

const rateLimiters = new Map<string, LRUCache<string, number>>();

/**
 * Get or create a rate limiter for a specific route
 */
function getRateLimiter(route: string, options: RateLimitOptions): LRUCache<string, number> {
    const key = `${route}-${options.interval}-${options.uniqueTokenPerInterval}`;

    if (!rateLimiters.has(key)) {
        rateLimiters.set(key, new LRUCache({
            max: options.uniqueTokenPerInterval,
            ttl: options.interval,
        }));
    }

    return rateLimiters.get(key)!;
}

/**
 * Get IP address from request
 */
export function getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');

    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    if (realIP) {
        return realIP;
    }

    return 'unknown';
}

/**
 * Check if request exceeds rate limit
 * @param request - Next.js request object
 * @param limit - Maximum number of requests allowed
 * @param interval - Time window in milliseconds (default: 60000 = 1 minute)
 * @returns true if within limit, false if exceeded
 */
export function checkRateLimit(
    request: NextRequest,
    limit: number,
    interval: number = 60000
): boolean {
    const ip = getClientIP(request);
    const route = new URL(request.url).pathname;

    const limiter = getRateLimiter(route, {
        interval,
        uniqueTokenPerInterval: 500,
    });

    const tokenCount = (limiter.get(ip) as number) || 0;

    if (tokenCount >= limit) {
        return false;
    }

    limiter.set(ip, tokenCount + 1);
    return true;
}

/**
 * Rate limit presets for common use cases
 */
export const RateLimits = {
    // Strict limits for authentication endpoints
    AUTH_LOGIN: { limit: 5, interval: 60000 }, // 5 per minute
    AUTH_OTP: { limit: 3, interval: 60000 }, // 3 per minute
    AUTH_RESET: { limit: 3, interval: 300000 }, // 3 per 5 minutes

    // Moderate limits for API endpoints
    API_WRITE: { limit: 30, interval: 60000 }, // 30 per minute
    API_READ: { limit: 100, interval: 60000 }, // 100 per minute

    // Generous limits for static/master data
    API_MASTER: { limit: 200, interval: 60000 }, // 200 per minute
} as const;

/**
 * Middleware helper for rate limiting
 */
export function withRateLimit(
    limit: number,
    interval: number = 60000
) {
    return (request: NextRequest) => {
        if (!checkRateLimit(request, limit, interval)) {
            return {
                allowed: false,
                remaining: 0,
                reset: Date.now() + interval,
            };
        }

        return {
            allowed: true,
            remaining: limit - 1, // Approximate
            reset: Date.now() + interval,
        };
    };
}
