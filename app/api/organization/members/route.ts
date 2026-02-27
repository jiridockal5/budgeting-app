import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/serverUser";

const inviteSchema = z.object({
  organizationId: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).optional().default("MEMBER"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = inviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid invite payload", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { id: userId } = await getServerUser();
    const input = parsed.data;

    const org = await prisma.organization.findFirst({
      where: { id: input.organizationId },
      include: { members: true },
    });

    if (!org) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    const callerMember = org.members.find((m) => m.userId === userId);
    if (
      !callerMember ||
      (callerMember.role !== "OWNER" && callerMember.role !== "ADMIN")
    ) {
      return NextResponse.json(
        { success: false, error: "Only owners and admins can invite members" },
        { status: 403 }
      );
    }

    const invitedUser = await prisma.user.findFirst({
      where: { email: input.email },
    });

    const member = await prisma.organizationMember.create({
      data: {
        organizationId: org.id,
        userId: invitedUser?.id ?? "pending",
        role: input.role,
        inviteEmail: input.email,
        inviteAccepted: false,
      },
    });

    return NextResponse.json(
      { success: true, data: member },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/organization/members error", error);

    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return NextResponse.json(
        { success: false, error: "User is already a member of this organization" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");
    const organizationId = searchParams.get("organizationId");

    if (!memberId || !organizationId) {
      return NextResponse.json(
        { success: false, error: "memberId and organizationId required" },
        { status: 400 }
      );
    }

    const { id: userId } = await getServerUser();

    const org = await prisma.organization.findFirst({
      where: { id: organizationId },
      include: { members: true },
    });

    if (!org) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    const callerMember = org.members.find((m) => m.userId === userId);
    if (
      !callerMember ||
      (callerMember.role !== "OWNER" && callerMember.role !== "ADMIN")
    ) {
      return NextResponse.json(
        { success: false, error: "Permission denied" },
        { status: 403 }
      );
    }

    const targetMember = org.members.find((m) => m.id === memberId);
    if (!targetMember) {
      return NextResponse.json(
        { success: false, error: "Member not found" },
        { status: 404 }
      );
    }

    if (targetMember.role === "OWNER") {
      return NextResponse.json(
        { success: false, error: "Cannot remove the organization owner" },
        { status: 400 }
      );
    }

    await prisma.organizationMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/organization/members error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}
