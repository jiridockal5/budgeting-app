import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// no-op middleware (nedělá nic, jen pustí request dál)
export function middleware(req: NextRequest) {
  return NextResponse.next();
}

// žádné route matchery → middleware je prakticky vypnutý
export const config = {
  matcher: [],
};
