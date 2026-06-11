import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/serverUser";
import { requireAppAccess } from "@/lib/requireAppAccess";
import { captureRouteException } from "@/lib/monitoring";

const createSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function GET() {
  try {
    const { id: userId } = await getServerUser();
    const denied = await requireAppAccess(userId);
    if (denied) return denied;

    const orgs = await prisma.organization.findMany({
      where: {
        OR: [
          { userId },
          { members: { some: { userId, inviteAccepted: true } } },
        ],
      },
      include: {
        members: {
          select: {
            id: true,
            userId: true,
            role: true,
            inviteEmail: true,
            inviteAccepted: true,
          },
        },
        _count: { select: { plans: true } },
      },
    });

    return NextResponse.json({ success: true, data: orgs });
  } catch (error) {
    captureRouteException("GET /api/organization", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Organization name is required" },
        { status: 400 }
      );
    }

    const { id: userId, email } = await getServerUser();
    const denied = await requireAppAccess(userId);
    if (denied) return denied;

    const org = await prisma.organization.create({
      data: {
        name: parsed.data.name,
        userId,
        members: {
          create: {
            userId,
            role: "OWNER",
            inviteEmail: email,
            inviteAccepted: true,
          },
        },
      },
      include: { members: true },
    });

    return NextResponse.json(
      { success: true, data: org },
      { status: 201 }
    );
  } catch (error) {
    captureRouteException("POST /api/organization", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}
