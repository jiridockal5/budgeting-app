import { NextRequest } from "next/server";
import type { Person } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { expenseCategorySchema } from "@/lib/schemas/expenseCategory";
import { jsonErr, jsonOk, jsonServerError } from "@/lib/server/apiEnvelope";
import { getScopedScenario } from "@/lib/server/planScope";
import { captureServerEvent } from "@/lib/posthogServer";

const personUpdateSchema = z.object({
  planId: z.string().min(1),
  scenarioId: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  type: z.enum(["employee", "contractor", "advisor"]).optional(),
  salary: z.number().positive(),
  category: expenseCategorySchema,
  fte: z.number().min(0).max(10),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

function serializePerson(person: Person) {
  return {
    ...person,
    startDate: person.startDate ? person.startDate.toISOString() : null,
    endDate: person.endDate ? person.endDate.toISOString() : null,
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
    const scoped = await getScopedScenario(input.scenarioId);
    if (!scoped.ok) return scoped.response;
    if (scoped.plan.id !== input.planId) {
      return jsonErr("Scenario does not belong to this plan", 404);
    }

    const existing = await prisma.person.findFirst({
      where: {
        id,
        scenarioId: scoped.scenario.id,
        planId: scoped.plan.id,
      },
    });

    if (!existing) {
      return jsonErr("Person not found for this scenario", 404);
    }

    const updated = await prisma.person.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        role: input.role,
        type: input.type ?? "employee",
        salary: input.salary,
        category: input.category,
        fte: input.fte,
        startDate: input.startDate ? normalizeDate(input.startDate) : null,
        endDate: input.endDate ? normalizeDate(input.endDate) : null,
      },
    });

    await captureServerEvent(scoped.userId, "headcount_updated", {
      employment_type: updated.type,
      category: updated.category,
      has_end_date: Boolean(updated.endDate),
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
    const scenarioId = searchParams.get("scenarioId");

    if (!planId || !scenarioId) {
      return jsonErr("planId and scenarioId are required", 400);
    }

    const scoped = await getScopedScenario(scenarioId);
    if (!scoped.ok) return scoped.response;
    if (scoped.plan.id !== planId) {
      return jsonErr("Scenario does not belong to this plan", 404);
    }

    const existing = await prisma.person.findFirst({
      where: {
        id,
        scenarioId: scoped.scenario.id,
        planId: scoped.plan.id,
      },
    });

    if (!existing) {
      return jsonErr("Person not found for this scenario", 404);
    }

    await prisma.person.delete({
      where: { id: existing.id },
    });
    await captureServerEvent(scoped.userId, "headcount_deleted", {
      employment_type: existing.type,
      category: existing.category,
    });

    return jsonOk(null);
  } catch (error) {
    return jsonServerError("DELETE /api/people/[id]", error);
  }
}
