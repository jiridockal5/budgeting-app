import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/serverUser";

/**
 * Health-check endpoint for the forecast system.
 * Requires authentication.
 *
 * GET /api/test-forecast
 */
export async function GET() {
  try {
    const user = await getServerUser();

    return NextResponse.json({
      success: true,
      message: "Forecast system is operational",
      userId: user.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Authentication required",
      },
      { status: 401 }
    );
  }
}
