import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "./prisma";
import { getServerUser } from "./serverUser";

export type ApiHandler = () => Promise<NextResponse>;

export function apiError(
  message: string,
  status: number,
  details?: unknown
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details ? { details } : {}),
    },
    { status }
  );
}

export function apiSuccess(data: unknown, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export async function withErrorHandling(
  handler: ApiHandler,
  label: string
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    console.error(`${label} error`, error);

    if (error instanceof ZodError) {
      return apiError("Validation failed", 400, error.issues);
    }

    if (
      error instanceof Error &&
      error.message === "Authentication required"
    ) {
      return apiError("Authentication required", 401);
    }

    return apiError(
      error instanceof Error ? error.message : "Unexpected error",
      500
    );
  }
}

export async function requirePlanAccess(planId: string) {
  const { id: userId } = await getServerUser();
  const plan = await prisma.plan.findFirst({
    where: { id: planId, userId },
  });

  if (!plan) {
    throw Object.assign(new Error("Plan not found for this user"), {
      statusCode: 404,
    });
  }

  return { plan, userId };
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests = 60,
  windowMs = 60_000
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return false;
  }

  return true;
}
