import { NextResponse, type NextRequest } from "next/server";

import { createServerClient } from "@supabase/ssr";

const PUBLIC_ROUTES = ["/login", "/signup", "/pricing", "/auth", "/api"];

const PROTECTED_PREFIX = "/app";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static & public assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)
  ) {
    return NextResponse.next();
  }

  const isPublicRoute =
    pathname === "/" ||
    PUBLIC_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  let response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Unauthenticated user trying to access /app/*
  if (!session && pathname.startsWith(PROTECTED_PREFIX)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Authenticated user going to / or /login → redirect to /app
  if (session && (pathname === "/" || pathname === "/login" || pathname === "/signup")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/app";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
