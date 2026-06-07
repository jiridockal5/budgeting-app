import { NextResponse } from "next/server";
import { getUserAccessInfo } from "./planGating";

export async function requireAppAccess(
  userId: string
): Promise<NextResponse | null> {
  const access = await getUserAccessInfo(userId);

  if (!access.hasAppAccess) {
    return NextResponse.json(
      {
        success: false,
        error: "Subscription required. Your trial has ended.",
        locked: true,
        upgradeUrl: "/app/subscribe",
      },
      { status: 402 }
    );
  }

  return null;
}
