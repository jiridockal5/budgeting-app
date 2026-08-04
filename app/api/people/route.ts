import { NextRequest } from "next/server";
import type { Person } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { expenseCategorySchema } from "@/lib/schemas/expenseCategory";
import { jsonErr, jsonOk, jsonServerError } from "@/lib/server/apiEnvelope";
import { getScopedScenario } from "@/lib/server/planScope";
import { captureServerEvent } from "@/lib/posthogServer";

const personInputSchema = z.object({
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

const querySchema = z.object({
  planId: z.string().min(1),
  scenarioId: z.string().min(1),
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      planId: searchParams.get("planId") ?? "",
      scenarioId: searchParams.get("scenarioId") ?? "",
    });

    if (!parsed.success) {
      return jsonErr("planId and scenarioId are required", 400);
    }

    const scoped = await getScopedScenario(parsed.data.scenarioId);
    if (!scoped.ok) return scoped.response;
    if (scoped.plan.id !== parsed.data.planId) {
      return jsonErr("Scenario does not belong to this plan", 404);
    }

    const people = await prisma.person.findMany({
      where: { scenarioId: scoped.scenario.id },
      orderBy: { createdAt: "asc" },
    });

    return jsonOk(people.map(serializePerson));
  } catch (error) {
    return jsonServerError("GET /api/people", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = personInputSchema.safeParse(body);

    if (!parsed.success) {
      return jsonErr("Invalid person payload", 400);
    }

    const input = parsed.data;
    const scoped = await getScopedScenario(input.scenarioId);
    if (!scoped.ok) return scoped.response;
    if (scoped.plan.id !== input.planId) {
      return jsonErr("Scenario does not belong to this plan", 404);
    }

    const person = await prisma.person.create({
      data: {
        planId: scoped.plan.id,
        scenarioId: scoped.scenario.id,
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

    await captureServerEvent(scoped.userId, "headcount_added", {
      employment_type: person.type,
      category: person.category,
      has_end_date: Boolean(person.endDate),
    });

    return jsonOk(serializePerson(person), 201);
  } catch (error) {
    return jsonServerError("POST /api/people", error);
  }
}
