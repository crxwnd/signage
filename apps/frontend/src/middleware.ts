/**
 * Next.js Middleware
 * Route protection and authentication checks
 * Runs before each request to protected routes
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = ['/login', '/register'];

/**
 * Auth routes that authenticated users shouldn't access
 */
const AUTH_ROUTES = ['/login', '/register'];

/**
 * Check if user has refresh token cookie
 * This is a basic check - full validation happens on the server
 */
function hasRefreshToken(request: NextRequest): boolean {
  const refreshToken = request.cookies.get('refreshToken');
  return !!refreshToken;
}

/**
 * Middleware function
 * Protects routes and handles redirects
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get refresh token from cookies
  const isAuthenticated = hasRefreshToken(request);

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Check if route is auth route (login/register)
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // If user is authenticated and tries to access auth routes (login/register)
  // Redirect to /displays
  if (isAuthenticated && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/displays';
    return NextResponse.redirect(url);
  }

  // If user is not authenticated and tries to access protected route
  // Redirect to /login
  if (!isAuthenticated && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    // Add redirect query param to return user after login
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Allow request to continue
  return NextResponse.next();
}

/**
 * Middleware config
 * Specify which routes this middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
