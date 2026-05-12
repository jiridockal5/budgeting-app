import { NextRequest } from "next/server";
import type { Person } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { expenseCategorySchema } from "@/lib/schemas/expenseCategory";
import { jsonErr, jsonOk, jsonServerError } from "@/lib/server/apiEnvelope";
import { getScopedPlan } from "@/lib/server/planScope";

const personInputSchema = z.object({
  planId: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  salary: z.number().positive(),
  category: expenseCategorySchema,
  fte: z.number().min(0).max(10),
  startDate: z.string().optional().nullable(),
});

const querySchema = z.object({
  planId: z.string().min(1),
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      planId: searchParams.get("planId") ?? "",
    });

    if (!parsed.success) {
      return jsonErr("planId is required", 400);
    }

    const scoped = await getScopedPlan(parsed.data.planId);
    if (!scoped.ok) return scoped.response;

    const people = await prisma.person.findMany({
      where: { planId: scoped.plan.id },
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
    const scoped = await getScopedPlan(input.planId);
    if (!scoped.ok) return scoped.response;

    const person = await prisma.person.create({
      data: {
        planId: scoped.plan.id,
        name: input.name,
        role: input.role,
        salary: input.salary,
        category: input.category,
        fte: input.fte,
        startDate: input.startDate ? normalizeDate(input.startDate) : null,
      },
    });

    return jsonOk(serializePerson(person), 201);
  } catch (error) {
    return jsonServerError("POST /api/people", error);
  }
}
