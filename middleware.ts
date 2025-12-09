import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(_req: NextRequest) {
  // TEMPORARY: allow all authenticated paths through without checks
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
