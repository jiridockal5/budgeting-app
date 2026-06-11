import { NextResponse } from "next/server";
import { getUserAccessInfo } from "./planGating";
import { getServerUser } from "./serverUser";

export async function requireAppAccess(
  userId: string
): Promise<NextResponse | null> {
  let authEmail: string | null | undefined;
  try {
    const serverUser = await getServerUser();
    authEmail = serverUser.email;
  } catch {
    // userId-only check below
  }

  const access = await getUserAccessInfo(userId, authEmail);

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
