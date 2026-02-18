import { NextResponse } from 'next/server';
import { HttpStatus, ErrorCode } from './constants';

/**
 * Standard API Response Interface
 */
export interface APIResponse<T = any> {
    success: boolean;
    code: number;
    data?: T;
    error?: string;
    errorCode?: string;
    pagination?: PaginationMeta;
    timestamp?: string;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

/**
 * Custom API Error Class
 */
export class APIError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public errorCode?: string,
        public details?: any
    ) {
        super(message);
        this.name = 'APIError';
        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message: string, details?: any) {
        return new APIError(HttpStatus.BAD_REQUEST, message, ErrorCode.VALIDATION_ERROR, details);
    }

    static unauthorized(message: string = 'Unauthorized') {
        return new APIError(HttpStatus.UNAUTHORIZED, message, ErrorCode.UNAUTHORIZED);
    }

    static forbidden(message: string = 'Forbidden') {
        return new APIError(HttpStatus.FORBIDDEN, message, ErrorCode.FORBIDDEN);
    }

    static notFound(message: string = 'Resource not found') {
        return new APIError(HttpStatus.NOT_FOUND, message, ErrorCode.NOT_FOUND);
    }

    static rateLimitExceeded(message: string = 'Too many requests') {
        return new APIError(HttpStatus.TOO_MANY_REQUESTS, message, ErrorCode.RATE_LIMIT_EXCEEDED);
    }

    static internal(message: string = 'Internal server error') {
        return new APIError(HttpStatus.INTERNAL_SERVER_ERROR, message, ErrorCode.INTERNAL_ERROR);
    }
}

/**
 * Success response helper
 */
export function apiResponse<T>(
    data: T,
    status: number = HttpStatus.OK,
    pagination?: PaginationMeta
): NextResponse<APIResponse<T>> {
    return NextResponse.json(
        {
            success: true,
            code: status,
            data,
            ...(pagination && { pagination }),
            timestamp: new Date().toISOString(),
        },
        { status }
    );
}

/**
 * Error response helper
 */
export function apiError(error: unknown): NextResponse<APIResponse> {
    // Handle APIError instances
    if (error instanceof APIError) {
        console.error(`[APIError] ${error.errorCode}: ${error.message}`, error.details);
        return NextResponse.json(
            {
                success: false,
                code: error.statusCode,
                error: error.message,
                errorCode: error.errorCode,
                timestamp: new Date().toISOString(),
            },
            { status: error.statusCode }
        );
    }

    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error as { code: string; message: string };

        // P2002: Unique constraint violation
        if (prismaError.code === 'P2002') {
            return NextResponse.json(
                {
                    success: false,
                    code: HttpStatus.CONFLICT,
                    error: 'A record with this information already exists',
                    errorCode: ErrorCode.DATABASE_ERROR,
                    timestamp: new Date().toISOString(),
                },
                { status: HttpStatus.CONFLICT }
            );
        }

        // P2025: Record not found
        if (prismaError.code === 'P2025') {
            return NextResponse.json(
                {
                    success: false,
                    code: HttpStatus.NOT_FOUND,
                    error: 'Record not found',
                    errorCode: ErrorCode.NOT_FOUND,
                    timestamp: new Date().toISOString(),
                },
                { status: HttpStatus.NOT_FOUND }
            );
        }
    }

    // Handle Zod validation errors
    if (error && typeof error === 'object' && 'issues' in error) {
        const zodError = error as { issues: Array<{ path: string[]; message: string }> };
        const validationErrors = zodError.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
        }));

        return NextResponse.json(
            {
                success: false,
                code: HttpStatus.UNPROCESSABLE_ENTITY,
                error: 'Validation failed',
                errorCode: ErrorCode.VALIDATION_ERROR,
                details: validationErrors,
                timestamp: new Date().toISOString(),
            },
            { status: HttpStatus.UNPROCESSABLE_ENTITY }
        );
    }

    // Generic error
    console.error('[Unexpected Error]:', error);
    return NextResponse.json(
        {
            success: false,
            code: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'An unexpected error occurred',
            errorCode: ErrorCode.INTERNAL_ERROR,
            timestamp: new Date().toISOString(),
        },
        { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
}

/**
 * Rate limit error response
 */
export function rateLimitError(
    retryAfter: number
): NextResponse<APIResponse> {
    const response = NextResponse.json(
        {
            success: false,
            code: HttpStatus.TOO_MANY_REQUESTS,
            error: 'Rate limit exceeded. Please try again later.',
            errorCode: ErrorCode.RATE_LIMIT_EXCEEDED,
            timestamp: new Date().toISOString(),
        },
        { status: HttpStatus.TOO_MANY_REQUESTS }
    );

    response.headers.set('Retry-After', Math.ceil(retryAfter / 1000).toString());
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Remaining', '0');
    response.headers.set('X-RateLimit-Reset', (Date.now() + retryAfter).toString());

    return response;
}

/**
 * Set cache headers on response
 */
export function withCache(
    response: NextResponse,
    maxAge: number,
    staleWhileRevalidate: number = maxAge * 2
): NextResponse {
    if (maxAge > 0) {
        response.headers.set(
            'Cache-Control',
            `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
        );
    }
    return response;
}
