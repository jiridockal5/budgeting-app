import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars are missing, allow through (will fail at runtime with clear error)
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Middleware: Missing Supabase environment variables");
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          req.cookies.set(name, value);
        });
        response = NextResponse.next({
          request: {
            headers: req.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isApiRoute = req.nextUrl.pathname.startsWith("/api");

  // Stripe webhooks use signature verification, not session auth
  if (req.nextUrl.pathname === "/api/webhooks/stripe") {
    return response;
  }

  if (!user) {
    if (isApiRoute) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Enforce email verification for email/password accounts.
  // (OAuth providers verify emails on their side; confirmed users have email_confirmed_at set.)
  const isEmailProvider = user.app_metadata?.provider === "email";
  if (isEmailProvider && !user.email_confirmed_at) {
    if (isApiRoute) {
      return NextResponse.json(
        { success: false, error: "Email not verified" },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL("/verify-email", req.url));
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/api/:path*"],
};
