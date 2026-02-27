import { describe, it, expect } from "vitest";
import {
  buildForecast,
  addMonths,
  dateToMonth,
  DEFAULT_REVENUE_CONFIG,
  type RevenueConfig,
  type ExpenseInput,
  type AssumptionsInput,
} from "../revenueForecast";
import { DEFAULT_ASSUMPTIONS } from "../assumptions";

const defaultAssumptions: AssumptionsInput = {
  ...DEFAULT_ASSUMPTIONS,
};

const emptyExpenses: ExpenseInput = {
  headcount: [],
  nonHeadcount: [],
};

describe("addMonths", () => {
  it("adds months correctly", () => {
    expect(addMonths("2025-01", 0)).toBe("2025-01");
    expect(addMonths("2025-01", 1)).toBe("2025-02");
    expect(addMonths("2025-01", 12)).toBe("2026-01");
    expect(addMonths("2025-11", 2)).toBe("2026-01");
  });
});

describe("dateToMonth", () => {
  it("converts dates", () => {
    expect(dateToMonth(new Date("2025-03-15T00:00:00Z"))).toBe("2025-03");
    expect(dateToMonth("2025-06-01T00:00:00Z")).toBe("2025-06");
  });
});

describe("buildForecast", () => {
  it("returns correct number of months", () => {
    const result = buildForecast(
      12,
      "2025-01",
      DEFAULT_REVENUE_CONFIG,
      emptyExpenses,
      defaultAssumptions
    );
    expect(result.months).toHaveLength(12);
    expect(result.months[0].date).toBe("2025-01");
    expect(result.months[11].date).toBe("2025-12");
  });

  it("produces zero MRR with zero revenue config", () => {
    const zeroConfig: RevenueConfig = {
      plg: { monthlyTrials: 0, trialConversionRate: 0, avgAcv: 0, churnRate: 0, expansionRate: 0 },
      sales: { monthlySqls: 0, closeRate: 0, avgAcv: 0, churnRate: 0, expansionRate: 0 },
      partners: { monthlyReferrals: 0, closeRate: 0, avgAcv: 0, commissionRate: 0 },
    };
    const result = buildForecast(6, "2025-01", zeroConfig, emptyExpenses, defaultAssumptions);
    expect(result.months[5].totalMrr).toBe(0);
    expect(result.summary.projectedArr).toBe(0);
  });

  it("MRR increases over time with positive revenue config", () => {
    const result = buildForecast(
      12,
      "2025-01",
      DEFAULT_REVENUE_CONFIG,
      emptyExpenses,
      defaultAssumptions
    );
    expect(result.months[11].totalMrr).toBeGreaterThan(result.months[0].totalMrr);
    expect(result.summary.projectedArr).toBeGreaterThan(0);
  });

  it("customers grow over time", () => {
    const result = buildForecast(
      12,
      "2025-01",
      DEFAULT_REVENUE_CONFIG,
      emptyExpenses,
      defaultAssumptions
    );
    expect(result.months[11].totalCustomers).toBeGreaterThan(0);
    expect(result.months[11].totalCustomers).toBeGreaterThan(
      result.months[0].totalCustomers
    );
  });

  it("expenses are calculated correctly", () => {
    const expenses: ExpenseInput = {
      headcount: [
        { role: "Dev", category: "rnd", baseSalary: 5000, fte: 1, startMonth: "2025-01" },
      ],
      nonHeadcount: [
        { name: "AWS", category: "cos", amount: 1000, frequency: "monthly", startMonth: "2025-01" },
      ],
    };

    const result = buildForecast(
      12,
      "2025-01",
      DEFAULT_REVENUE_CONFIG,
      expenses,
      defaultAssumptions
    );

    const first = result.months[0];
    expect(first.headcountExpense).toBeGreaterThan(5000);
    expect(first.nonHeadcountExpense).toBe(1000);
    expect(first.totalExpense).toBe(first.headcountExpense + first.nonHeadcountExpense);
  });

  it("headcount costs increase with salary tax rate", () => {
    const expenses: ExpenseInput = {
      headcount: [
        { role: "Dev", category: "rnd", baseSalary: 5000, fte: 1, startMonth: "2025-01" },
      ],
      nonHeadcount: [],
    };

    const result = buildForecast(
      1,
      "2025-01",
      DEFAULT_REVENUE_CONFIG,
      expenses,
      defaultAssumptions
    );

    const expectedWithTax = 5000 * (1 + defaultAssumptions.salaryTaxRate / 100);
    expect(result.months[0].headcountExpense).toBeCloseTo(expectedWithTax, 0);
  });

  it("annual expenses are spread monthly", () => {
    const expenses: ExpenseInput = {
      headcount: [],
      nonHeadcount: [
        { name: "License", category: "ops", amount: 12000, frequency: "annual", startMonth: "2025-01" },
      ],
    };

    const result = buildForecast(1, "2025-01", DEFAULT_REVENUE_CONFIG, expenses, defaultAssumptions);
    expect(result.months[0].nonHeadcountExpense).toBe(1000);
  });

  it("one-time expenses only apply in start month", () => {
    const expenses: ExpenseInput = {
      headcount: [],
      nonHeadcount: [
        { name: "Setup", category: "ops", amount: 5000, frequency: "one_time", startMonth: "2025-03" },
      ],
    };

    const result = buildForecast(6, "2025-01", DEFAULT_REVENUE_CONFIG, expenses, defaultAssumptions);
    expect(result.months[0].nonHeadcountExpense).toBe(0);
    expect(result.months[1].nonHeadcountExpense).toBe(0);
    expect(result.months[2].nonHeadcountExpense).toBe(5000);
    expect(result.months[3].nonHeadcountExpense).toBe(0);
  });

  it("net burn is positive when expenses exceed revenue", () => {
    const expenses: ExpenseInput = {
      headcount: [
        { role: "Team", category: "rnd", baseSalary: 50000, fte: 1, startMonth: "2025-01" },
      ],
      nonHeadcount: [],
    };

    const result = buildForecast(1, "2025-01", DEFAULT_REVENUE_CONFIG, expenses, defaultAssumptions);
    expect(result.months[0].netBurn).toBeGreaterThan(0);
  });

  it("computes runway correctly", () => {
    const assumptions: AssumptionsInput = {
      ...defaultAssumptions,
      cashOnHand: 100000,
    };

    const expenses: ExpenseInput = {
      headcount: [
        { role: "Team", category: "rnd", baseSalary: 10000, fte: 1, startMonth: "2025-01" },
      ],
      nonHeadcount: [],
    };

    const zeroConfig: RevenueConfig = {
      plg: { monthlyTrials: 0, trialConversionRate: 0, avgAcv: 0, churnRate: 0, expansionRate: 0 },
      sales: { monthlySqls: 0, closeRate: 0, avgAcv: 0, churnRate: 0, expansionRate: 0 },
      partners: { monthlyReferrals: 0, closeRate: 0, avgAcv: 0, commissionRate: 0 },
    };

    const result = buildForecast(24, "2025-01", zeroConfig, expenses, assumptions);
    expect(result.summary.runwayMonths).toBeGreaterThan(0);
    expect(result.summary.runwayMonths).toBeLessThan(24);
    expect(result.summary.cashOnHand).toBe(100000);
  });

  it("cashRemaining decreases when expenses outweigh revenue", () => {
    const assumptions: AssumptionsInput = {
      ...defaultAssumptions,
      cashOnHand: 500000,
    };

    const expenses: ExpenseInput = {
      headcount: [
        { role: "Team", category: "rnd", baseSalary: 100000, fte: 1, startMonth: "2025-01" },
      ],
      nonHeadcount: [],
    };

    const zeroConfig: RevenueConfig = {
      plg: { monthlyTrials: 0, trialConversionRate: 0, avgAcv: 0, churnRate: 0, expansionRate: 0 },
      sales: { monthlySqls: 0, closeRate: 0, avgAcv: 0, churnRate: 0, expansionRate: 0 },
      partners: { monthlyReferrals: 0, closeRate: 0, avgAcv: 0, commissionRate: 0 },
    };

    const result = buildForecast(12, "2025-01", zeroConfig, expenses, assumptions);
    expect(result.months[0].cashRemaining).toBeLessThan(500000);
    expect(result.months[11].cashRemaining).toBeLessThan(result.months[0].cashRemaining);
  });

  it("summary metrics are computed", () => {
    const result = buildForecast(
      12,
      "2025-01",
      DEFAULT_REVENUE_CONFIG,
      emptyExpenses,
      defaultAssumptions
    );

    expect(result.summary.projectedArr).toBeGreaterThan(0);
    expect(result.summary.projectedMrr).toBeGreaterThan(0);
    expect(result.summary.annualNrr).toBeGreaterThan(0);
    expect(result.summary.annualGrr).toBeGreaterThan(0);
    expect(result.summary.annualGrr).toBeLessThanOrEqual(100);
    expect(result.summary.netNewArr).toBeGreaterThan(0);
    expect(result.summary.totalCustomers).toBeGreaterThan(0);
  });

  it("handles empty months", () => {
    const result = buildForecast(0, "2025-01", DEFAULT_REVENUE_CONFIG, emptyExpenses, defaultAssumptions);
    expect(result.months).toHaveLength(0);
    expect(result.summary.projectedArr).toBe(0);
  });

  it("FTE scaling works", () => {
    const fullTimeExpenses: ExpenseInput = {
      headcount: [
        { role: "Dev", category: "rnd", baseSalary: 5000, fte: 1, startMonth: "2025-01" },
      ],
      nonHeadcount: [],
    };

    const halfTimeExpenses: ExpenseInput = {
      headcount: [
        { role: "Dev", category: "rnd", baseSalary: 5000, fte: 0.5, startMonth: "2025-01" },
      ],
      nonHeadcount: [],
    };

    const fullResult = buildForecast(1, "2025-01", DEFAULT_REVENUE_CONFIG, fullTimeExpenses, defaultAssumptions);
    const halfResult = buildForecast(1, "2025-01", DEFAULT_REVENUE_CONFIG, halfTimeExpenses, defaultAssumptions);

    expect(halfResult.months[0].headcountExpense).toBeCloseTo(
      fullResult.months[0].headcountExpense / 2,
      0
    );
  });
});
