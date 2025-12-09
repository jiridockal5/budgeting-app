import { Prisma } from "@prisma/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { prisma } from "@/lib/prisma";
import { getServerUser, type ServerUser } from "@/lib/serverUser";
import ExpensesClient from "./ExpensesClient";
import { ExpenseView, PlanSummary } from "./types";

export const dynamic = "force-dynamic";

function startOfCurrentMonth() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

async function ensureUserRecord(userId: string, email?: string | null) {
  const safeEmail = email ?? `${userId}@demo.local`;

  await prisma.user.upsert({
    where: { id: userId },
    update: {
      email: safeEmail,
      name: email ?? "Demo User",
    },
    create: {
      id: userId,
      email: safeEmail,
      name: email ?? "Demo User",
    },
  });
}

function serializePlan(plan: any): PlanSummary {
  return {
    id: plan.id,
    name: plan.name,
    currency: plan.currency,
    startMonth: plan.startMonth.toISOString(),
    months: plan.months,
  };
}

function serializeExpense(expense: any): ExpenseView {
  return {
    id: expense.id,
    planId: expense.planId,
    name: expense.name,
    category: expense.category,
    amount:
      expense.amount instanceof Prisma.Decimal
        ? expense.amount.toNumber()
        : Number(expense.amount),
    frequency: expense.frequency,
    startMonth: expense.startMonth.toISOString(),
    endMonth: expense.endMonth ? expense.endMonth.toISOString() : null,
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
  };
}

async function getOrCreateDefaultPlan(user: ServerUser): Promise<PlanSummary> {
  await ensureUserRecord(user.id, user.email);

  const existing = await prisma.plan.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    return serializePlan(existing);
  }

  const created = await prisma.plan.create({
    data: {
      userId: user.id,
      name: "Default Plan",
      currency: "EUR",
      startMonth: startOfCurrentMonth(),
      months: 12,
    },
  });

  return serializePlan(created);
}

async function loadExpenses(planId: string): Promise<ExpenseView[]> {
  const expenses = await prisma.expense.findMany({
    where: { planId },
    orderBy: { startMonth: "asc" },
  });

  return expenses.map(serializeExpense);
}

export default async function ExpensesPage() {
  const user = await getServerUser();
  const plan = await getOrCreateDefaultPlan(user);
  const expenses = await loadExpenses(plan.id);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <PageHeader
          title="Expenses"
          subtitle="Track recurring and one-time costs for your plan."
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
          <p className="font-semibold text-slate-900">Plan selection</p>
          <p className="mt-1 text-slate-600">
            For now we load the first plan for the signed-in user (or create a
            default one). TODO: replace this with a proper plan picker tied to
            user/org selection once that flow is built. Using plan:
            <span className="ml-1 font-semibold text-slate-900">
              {plan.name}
            </span>
            .
          </p>
          {user.isFallback && (
            <p className="mt-2 text-amber-700">
              Using a demo user until Supabase user ↔ Prisma user syncing is
              finalized.
            </p>
          )}
        </div>

        <ExpensesClient plan={plan} initialExpenses={expenses} />
      </div>
    </main>
  );
}
