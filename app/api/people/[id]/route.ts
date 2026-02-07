import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/serverUser";

const personUpdateSchema = z.object({
  planId: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  salary: z.number().positive(),
  category: z.string().min(1),
  fte: z.number().min(0).max(10),
  startDate: z.string().optional().nullable(),
});

const serializePerson = (person: any) => ({
  ...person,
  startDate: person.startDate ? person.startDate.toISOString() : null,
  createdAt: person.createdAt.toISOString(),
  updatedAt: person.updatedAt.toISOString(),
});

function normalizeDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date value");
  }
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = personUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid person payload" },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const { id: userId } = await getServerUser();

    const plan = await prisma.plan.findFirst({
      where: { id: input.planId, userId },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Plan not found for this user" },
        { status: 404 }
      );
    }

    const existing = await prisma.person.findFirst({
      where: { id, planId: plan.id, plan: { userId } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Person not found for this plan" },
        { status: 404 }
      );
    }

    const updated = await prisma.person.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        role: input.role,
        salary: input.salary,
        category: input.category,
        fte: input.fte,
        startDate: input.startDate ? normalizeDate(input.startDate) : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: serializePerson(updated),
    });
  } catch (error) {
    console.error("PUT /api/people/[id] error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get("planId");

    if (!planId) {
      return NextResponse.json(
        { success: false, error: "planId is required" },
        { status: 400 }
      );
    }

    const { id: userId } = await getServerUser();

    const plan = await prisma.plan.findFirst({
      where: { id: planId, userId },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Plan not found for this user" },
        { status: 404 }
      );
    }

    const existing = await prisma.person.findFirst({
      where: { id, planId: plan.id, plan: { userId } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Person not found for this plan" },
        { status: 404 }
      );
    }

    await prisma.person.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/people/[id] error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}
