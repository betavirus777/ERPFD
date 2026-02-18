import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that don't require authentication
const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/verify-2fa']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if this is a public route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // API Profiling Logic
  if (pathname.startsWith('/api')) {
    const requestId = crypto.randomUUID();
    const requestStart = performance.now();

    // Clone the request headers and set the request ID
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-request-id', requestId);

    console.log(`[Middleware] Request ${requestId} ${request.method} ${pathname} - Started`);

    // For API routes, we want to pass through but with our new headers
    // We can't easily wrap the response here for *content* profiling without disabling streaming/edge
    // So we rely on the header being passed to the route handler

    // We must return a response with the new headers for the *next* handler (the route handler) to see them?
    // Actually, distinct from `NextResponse.next({ request: { headers: ... } })`

    // If it's a public route or authenticated, we proceed.
    // If it's protected API and no token, we might want to return 401 JSON instead of redirect?
    // But let's keep existing logic for now, just injecting ID.

    // NOTE: The `request` object is immutable. We use `NextResponse.next` to forward headers.
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Add ID to response headers so client can see it
    response.headers.set('x-request-id', requestId);

    return response;
  }

  // Get the token from cookies
  const token = request.cookies.get('token')?.value

  // If not authenticated and trying to access protected route, redirect to login
  if (!isPublicRoute && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If authenticated and trying to access login page, redirect to dashboard
  if (isPublicRoute && token && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
}

