import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/serverUser";
import { getUserAccessInfo } from "@/lib/planGating";

export async function GET() {
  try {
    const { id: userId } = await getServerUser();
    const access = await getUserAccessInfo(userId);

    return NextResponse.json({
      success: true,
      data: access,
    });
  } catch (error) {
    console.error("GET /api/billing/access error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}
