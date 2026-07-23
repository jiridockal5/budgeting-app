import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Clone assumptions, people, and expenses from one scenario onto another.
 * Does not overwrite target revenue config.
 */
export async function cloneScenarioInputs(
  sourceScenarioId: string,
  targetScenarioId: string,
  planId: string
): Promise<void> {
  const [sourceAsm, sourcePeople, sourceExpenses] = await Promise.all([
    prisma.globalAssumptions.findUnique({ where: { scenarioId: sourceScenarioId } }),
    prisma.person.findMany({ where: { scenarioId: sourceScenarioId } }),
    prisma.expense.findMany({ where: { scenarioId: sourceScenarioId } }),
  ]);

  if (sourceAsm) {
    await prisma.globalAssumptions.upsert({
      where: { scenarioId: targetScenarioId },
      create: {
        planId,
        scenarioId: targetScenarioId,
        cashOnHand: sourceAsm.cashOnHand,
        plannedRaiseMonth: sourceAsm.plannedRaiseMonth,
        plannedRaiseAmount: sourceAsm.plannedRaiseAmount,
        fundraisingFees: sourceAsm.fundraisingFees,
        minCashBuffer: sourceAsm.minCashBuffer,
        targetRunwayMonths: sourceAsm.targetRunwayMonths,
        churnRate: sourceAsm.churnRate,
        expansionRate: sourceAsm.expansionRate,
        paymentTimingDays: sourceAsm.paymentTimingDays,
        priceUplift: sourceAsm.priceUplift,
        salaryTaxRate: sourceAsm.salaryTaxRate,
        salaryGrowthRate: sourceAsm.salaryGrowthRate,
        commissionRate: sourceAsm.commissionRate,
        inflationRate: sourceAsm.inflationRate,
        baseAcv: sourceAsm.baseAcv,
      },
      update: {
        cashOnHand: sourceAsm.cashOnHand,
        plannedRaiseMonth: sourceAsm.plannedRaiseMonth,
        plannedRaiseAmount: sourceAsm.plannedRaiseAmount,
        fundraisingFees: sourceAsm.fundraisingFees,
        minCashBuffer: sourceAsm.minCashBuffer,
        targetRunwayMonths: sourceAsm.targetRunwayMonths,
        churnRate: sourceAsm.churnRate,
        expansionRate: sourceAsm.expansionRate,
        paymentTimingDays: sourceAsm.paymentTimingDays,
        priceUplift: sourceAsm.priceUplift,
        salaryTaxRate: sourceAsm.salaryTaxRate,
        salaryGrowthRate: sourceAsm.salaryGrowthRate,
        commissionRate: sourceAsm.commissionRate,
        inflationRate: sourceAsm.inflationRate,
        baseAcv: sourceAsm.baseAcv,
      },
    });
  } else {
    await prisma.globalAssumptions.deleteMany({
      where: { scenarioId: targetScenarioId },
    });
  }

  // Replace people/expenses on target with clones of source
  await prisma.person.deleteMany({ where: { scenarioId: targetScenarioId } });
  await prisma.expense.deleteMany({ where: { scenarioId: targetScenarioId } });

  if (sourcePeople.length > 0) {
    await prisma.person.createMany({
      data: sourcePeople.map((p) => ({
        planId,
        scenarioId: targetScenarioId,
        name: p.name,
        role: p.role,
        type: p.type,
        salary: p.salary,
        category: p.category,
        fte: p.fte,
        startDate: p.startDate,
        endDate: p.endDate,
        config: p.config === null ? Prisma.DbNull : p.config,
      })),
    });
  }

  if (sourceExpenses.length > 0) {
    await prisma.expense.createMany({
      data: sourceExpenses.map((e) => ({
        planId,
        scenarioId: targetScenarioId,
        name: e.name,
        category: e.category,
        amount: e.amount,
        frequency: e.frequency,
        startMonth: e.startMonth,
        endMonth: e.endMonth,
        config: e.config === null ? Prisma.DbNull : e.config,
      })),
    });
  }
}

/**
 * Reset a scenario to a blank starter: no assumptions row, null revenue config,
 * empty people/expenses. Onboarding treats this as incomplete until the user saves.
 */
export async function seedFreshScenarioInputs(
  scenarioId: string
): Promise<void> {
  await prisma.globalAssumptions.deleteMany({ where: { scenarioId } });
  await prisma.person.deleteMany({ where: { scenarioId } });
  await prisma.expense.deleteMany({ where: { scenarioId } });

  await prisma.forecastScenario.update({
    where: { id: scenarioId },
    data: {
      config: Prisma.DbNull,
    },
  });
}
