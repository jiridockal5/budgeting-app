import { NextRequest } from "next/server";
import type { Person } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { expenseCategorySchema } from "@/lib/schemas/expenseCategory";
import { jsonErr, jsonOk, jsonServerError } from "@/lib/server/apiEnvelope";
import { getScopedPlan } from "@/lib/server/planScope";

const personUpdateSchema = z.object({
  planId: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  salary: z.number().positive(),
  category: expenseCategorySchema,
  fte: z.number().min(0).max(10),
  startDate: z.string().optional().nullable(),
});

function serializePerson(person: Person) {
  return {
    ...person,
    startDate: person.startDate ? person.startDate.toISOString() : null,
    createdAt: person.createdAt.toISOString(),
    updatedAt: person.updatedAt.toISOString(),
  };
}

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
      return jsonErr("Invalid person payload", 400);
    }

    const input = parsed.data;
    const scoped = await getScopedPlan(input.planId);
    if (!scoped.ok) return scoped.response;

    const existing = await prisma.person.findFirst({
      where: { id, planId: scoped.plan.id, plan: { userId: scoped.userId } },
    });

    if (!existing) {
      return jsonErr("Person not found for this plan", 404);
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

    return jsonOk(serializePerson(updated));
  } catch (error) {
    return jsonServerError("PUT /api/people/[id]", error);
  }
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get("planId");

    if (!planId) {
      return jsonErr("planId is required", 400);
    }

    const scoped = await getScopedPlan(planId);
    if (!scoped.ok) return scoped.response;

    const existing = await prisma.person.findFirst({
      where: { id, planId: scoped.plan.id, plan: { userId: scoped.userId } },
    });

    if (!existing) {
      return jsonErr("Person not found for this plan", 404);
    }

    await prisma.person.delete({
      where: { id: existing.id },
    });

    return jsonOk(null);
  } catch (error) {
    return jsonServerError("DELETE /api/people/[id]", error);
  }
}
