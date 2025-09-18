import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  // Protected routes that require authentication
  const protectedRoutes = ["/dashboard", "/profile", "/admin", "/professor"];
  
  // Check if the current path should be protected
  const path = request.nextUrl.pathname;

  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  
  // Skip middleware for public routes and API routes
  if (!isProtectedRoute || path.startsWith("/api/auth")) {
    return NextResponse.next();
  }
  
  // Check for session cookie - update with the correct configuration
  const sessionCookie = getSessionCookie(request);

  // If no session cookie, redirect to login
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  // For admin routes, we need to check the role
  // Since we can't do full validation in middleware, we'll redirect to a role check page
  if (path.startsWith("/admin")) {
    // We need to do a server-side check for admin role
    return NextResponse.rewrite(new URL("/api/auth/check-admin", request.url));
  }
  
  // For professor routes, we need to check the role
  if (path.startsWith("/professor") && !path.startsWith("/professor/public")) {
    // We need to do a server-side check for professor role
    return NextResponse.rewrite(new URL("/api/auth/check-professor", request.url));
  }
  
  return NextResponse.next();
}

// Middleware configuration
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}; 