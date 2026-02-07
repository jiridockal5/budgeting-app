import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/serverUser";

const personInputSchema = z.object({
  planId: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  salary: z.number().positive(),
  category: z.string().min(1),
  fte: z.number().min(0).max(10),
  startDate: z.string().optional().nullable(),
});

const querySchema = z.object({
  planId: z.string().min(1),
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      planId: searchParams.get("planId") ?? "",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "planId is required" },
        { status: 400 }
      );
    }

    const { id: userId } = await getServerUser();

    const plan = await prisma.plan.findFirst({
      where: { id: parsed.data.planId, userId },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Plan not found for this user" },
        { status: 404 }
      );
    }

    const people = await prisma.person.findMany({
      where: { planId: plan.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: people.map(serializePerson),
    });
  } catch (error) {
    console.error("GET /api/people error", error);
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
    const parsed = personInputSchema.safeParse(body);

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

    const person = await prisma.person.create({
      data: {
        planId: plan.id,
        name: input.name,
        role: input.role,
        salary: input.salary,
        category: input.category,
        fte: input.fte,
        startDate: input.startDate ? normalizeDate(input.startDate) : null,
      },
    });

    return NextResponse.json(
      { success: true, data: serializePerson(person) },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/people error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}
