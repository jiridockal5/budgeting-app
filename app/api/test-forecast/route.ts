import { NextResponse } from "next/server";

/**
 * Simple health-check endpoint for the forecast system.
 *
 * GET /api/test-forecast
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: "test-forecast endpoint is working",
    });
  } catch (error) {
    console.error("test-forecast error", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
