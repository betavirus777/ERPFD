import { NextRequest, NextResponse } from 'next/server';

export function withProfiling(
    handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
    return async (req: NextRequest, ...args: any[]) => {
        const start = performance.now();
        const requestId = req.headers.get('x-request-id') || 'unknown';
        const method = req.method;
        const url = req.nextUrl.pathname;

        console.log(`[Profiler] ${requestId} ${method} ${url} - Handler Started`);

        try {
            const response = await handler(req, ...args);
            const duration = performance.now() - start;
            console.log(
                `[Profiler] ${requestId} ${method} ${url} - Handler Completed in ${duration.toFixed(
                    2
                )}ms`
            );

            // clone response to add header if possible (NextResponse is immutable-ish but we can try)
            // Actually standard Next.js way is to return new response or just log it. 
            // We will just log it here. The middleware can handle universal headers.

            return response;
        } catch (error) {
            const duration = performance.now() - start;
            console.error(
                `[Profiler] ${requestId} ${method} ${url} - Handler Failed in ${duration.toFixed(
                    2
                )}ms`
            );
            throw error;
        }
    };
}
