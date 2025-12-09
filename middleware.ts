import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

/**
 * Middleware for route protection
 * - Protects all /app/* routes (requires authentication)
 * - Allows public access to auth routes (/login, /signup, /verify)
 * - Allows public access to /pricing and static assets
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();

  // Public routes that don't require authentication
  const publicRoutes = [
    "/login",
    "/signup",
    "/verify",
    "/pricing",
    "/api/test-forecast", // Test endpoint (consider protecting in production)
  ];

  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Allow public routes and static assets
  if (isPublicRoute || pathname.startsWith("/_next") || pathname.startsWith("/api/auth")) {
    return res;
  }

  // Protect /app/* routes
  if (pathname.startsWith("/app")) {
    try {
      const supabase = createMiddlewareClient({ req, res });
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // Redirect to login if not authenticated
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // User is authenticated, allow access
      return res;
    } catch (error) {
      console.error("Middleware auth error:", error);
      // On error, redirect to login
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Allow all other routes (homepage, etc.)
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
