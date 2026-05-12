import { NextResponse } from "next/server";
import { captureRouteException } from "@/lib/monitoring";

/** Standard JSON success envelope for app API routes */
export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ success: true as const, data }, { status });
}

/** Standard JSON error envelope */
export function jsonErr(message: string, status: number) {
  return NextResponse.json({ success: false as const, error: message }, { status });
}

export function jsonServerError(
  routeLabel: string,
  error: unknown,
  exposeMessage = false
) {
  captureRouteException(routeLabel, error);
  const message =
    exposeMessage && error instanceof Error
      ? error.message
      : "Unexpected error";
  return jsonErr(message, 500);
}
