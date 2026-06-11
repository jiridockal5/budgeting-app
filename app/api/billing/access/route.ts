import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/serverUser";
import { getUserAccessInfo } from "@/lib/planGating";
import { captureRouteException } from "@/lib/monitoring";

export async function GET() {
  try {
    const { id: userId, email } = await getServerUser();
    const access = await getUserAccessInfo(userId, email);

    return NextResponse.json({
      success: true,
      data: access,
    });
  } catch (error) {
    captureRouteException("GET /api/billing/access", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}
