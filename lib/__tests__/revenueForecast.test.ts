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

  it("blends monthly and yearly deal revenue", () => {
    const revenue: RevenueConfig = {
      plg: {
        monthlyTrials: 10,
        trialConversionRate: 100,
        avgAcv: 12000,
        monthlyDealShare: 50,
        monthlyArpa: 500,
        churnRate: 0,
        expansionRate: 0,
      },
      sales: { monthlySqls: 0, closeRate: 0, avgAcv: 0, churnRate: 0, expansionRate: 0 },
      partners: { monthlyReferrals: 0, closeRate: 0, avgAcv: 0, commissionRate: 0 },
    };

    const result = buildForecast(1, "2025-01", revenue, emptyExpenses, defaultAssumptions);

    // 10 customers: half monthly at €500 MRR, half yearly at €12k ACV / 12 = €1k MRR.
    expect(result.months[0].plgMrr).toBe(7500);
  });

  it("tracks customer cash in separately from recognized MRR", () => {
    const revenue: RevenueConfig = {
      plg: {
        monthlyTrials: 10,
        trialConversionRate: 100,
        avgAcv: 12000,
        monthlyDealShare: 50,
        monthlyArpa: 500,
        churnRate: 0,
        expansionRate: 0,
      },
      sales: { monthlySqls: 0, closeRate: 0, avgAcv: 0, churnRate: 0, expansionRate: 0 },
      partners: { monthlyReferrals: 0, closeRate: 0, avgAcv: 0, commissionRate: 0 },
    };
    const assumptions = { ...defaultAssumptions, paymentTimingDays: 0 };

    const result = buildForecast(2, "2025-01", revenue, emptyExpenses, assumptions);

    expect(result.months[0].totalMrr).toBe(7500);
    expect(result.months[0].newCustomerCashIn).toBe(62500);
    expect(result.months[0].existingCustomerCashIn).toBe(0);
    expect(result.months[1].existingCustomerCashIn).toBe(2500);
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

  it("does not apply employer tax to contractors", () => {
    const employee: ExpenseInput = {
      headcount: [{ role: "Dev", type: "employee", category: "rnd", baseSalary: 5000, fte: 1, startMonth: "2025-01" }],
      nonHeadcount: [],
    };
    const contractor: ExpenseInput = {
      headcount: [{ role: "Dev", type: "contractor", category: "rnd", baseSalary: 5000, fte: 1, startMonth: "2025-01" }],
      nonHeadcount: [],
    };
    const noInflation = { ...defaultAssumptions, salaryGrowthRate: 0, salaryTaxRate: 35 };

    const emp = buildForecast(1, "2025-01", DEFAULT_REVENUE_CONFIG, employee, noInflation);
    const con = buildForecast(1, "2025-01", DEFAULT_REVENUE_CONFIG, contractor, noInflation);

    expect(emp.months[0].headcountExpense).toBeCloseTo(5000 * 1.35, 2);
    expect(con.months[0].headcountExpense).toBeCloseTo(5000, 2);
  });

  it("excludes people after their end month", () => {
    const expenses: ExpenseInput = {
      headcount: [
        { role: "Dev", category: "rnd", baseSalary: 5000, fte: 1, startMonth: "2025-01", endMonth: "2025-02" },
      ],
      nonHeadcount: [],
    };
    const result = buildForecast(4, "2025-01", DEFAULT_REVENUE_CONFIG, expenses, defaultAssumptions);
    expect(result.months[1].headcountExpense).toBeGreaterThan(0); // Feb: active
    expect(result.months[2].headcountExpense).toBe(0); // Mar: departed
  });
});

// ============================================================================
// Flexible cost model
// ============================================================================

const zeroRevenue: RevenueConfig = {
  plg: { monthlyTrials: 0, trialConversionRate: 0, avgAcv: 0, churnRate: 0, expansionRate: 0 },
  sales: { monthlySqls: 0, closeRate: 0, avgAcv: 0, churnRate: 0, expansionRate: 0 },
  partners: { monthlyReferrals: 0, closeRate: 0, avgAcv: 0, commissionRate: 0 },
};

const noGrowthAssumptions: AssumptionsInput = {
  ...defaultAssumptions,
  inflationRate: 0,
  salaryGrowthRate: 0,
};

function nonHeadcount(expenses: ExpenseInput["nonHeadcount"]): ExpenseInput {
  return { headcount: [], nonHeadcount: expenses };
}

describe("flexible cost model", () => {
  it("fixed (no config) behaves like a plain monthly cost", () => {
    const result = buildForecast(
      3,
      "2025-01",
      zeroRevenue,
      nonHeadcount([{ name: "AWS", category: "ops", amount: 1000, frequency: "monthly", startMonth: "2025-01" }]),
      noGrowthAssumptions
    );
    expect(result.months[0].nonHeadcountExpense).toBe(1000);
    expect(result.months[2].nonHeadcountExpense).toBe(1000);
  });

  it("growing applies a per-line annual compound rate from the line start", () => {
    const result = buildForecast(
      13,
      "2025-01",
      zeroRevenue,
      nonHeadcount([
        {
          name: "Marketing",
          category: "gtm",
          amount: 1000,
          frequency: "monthly",
          startMonth: "2025-01",
          config: { method: "growing", growthRate: 10, growthPeriod: "year", growthMode: "compound" },
        },
      ]),
      noGrowthAssumptions
    );
    expect(result.months[0].nonHeadcountExpense).toBeCloseTo(1000, 2); // year 0
    expect(result.months[12].nonHeadcountExpense).toBeCloseTo(1100, 2); // year 1: +10%
  });

  it("percentOfRevenue scales with total MRR", () => {
    const revenue: RevenueConfig = {
      ...DEFAULT_REVENUE_CONFIG,
    };
    const result = buildForecast(
      1,
      "2025-01",
      revenue,
      nonHeadcount([
        {
          name: "COS",
          category: "cos",
          amount: 0,
          frequency: "monthly",
          startMonth: "2025-01",
          config: { method: "percentOfRevenue", percent: 20, revenueBase: "total" },
        },
      ]),
      noGrowthAssumptions
    );
    const mrr = result.months[0].totalMrr;
    expect(mrr).toBeGreaterThan(0);
    expect(result.months[0].nonHeadcountExpense).toBeCloseTo(mrr * 0.2, 2);
  });

  it("perCustomer scales with active customer count", () => {
    const result = buildForecast(
      1,
      "2025-01",
      DEFAULT_REVENUE_CONFIG,
      nonHeadcount([
        {
          name: "Support",
          category: "cs",
          amount: 0,
          frequency: "monthly",
          startMonth: "2025-01",
          config: { method: "perCustomer", amountPerUnit: 10, customerBasis: "active", stream: "total" },
        },
      ]),
      noGrowthAssumptions
    );
    const customers = result.months[0].totalCustomers;
    expect(customers).toBeGreaterThan(0);
    expect(result.months[0].nonHeadcountExpense).toBeCloseTo(customers * 10, 2);
  });

  it("perEmployee scales with FTE", () => {
    const expenses: ExpenseInput = {
      headcount: [
        { role: "A", category: "rnd", baseSalary: 5000, fte: 1, startMonth: "2025-01" },
        { role: "B", category: "gtm", baseSalary: 5000, fte: 0.5, startMonth: "2025-01" },
      ],
      nonHeadcount: [
        {
          name: "Laptops",
          category: "ops",
          amount: 0,
          frequency: "monthly",
          startMonth: "2025-01",
          config: { method: "perEmployee", amountPerUnit: 100, employeeBasis: "fte" },
        },
      ],
    };
    const result = buildForecast(1, "2025-01", zeroRevenue, expenses, noGrowthAssumptions);
    expect(result.months[0].nonHeadcountExpense).toBeCloseTo(1.5 * 100, 2); // 1 + 0.5 FTE
  });

  it("per-month override takes precedence over the formula", () => {
    const result = buildForecast(
      3,
      "2025-01",
      zeroRevenue,
      nonHeadcount([
        {
          name: "Rent",
          category: "ops",
          amount: 1000,
          frequency: "monthly",
          startMonth: "2025-01",
          config: { method: "fixed", overrides: { "2025-02": 5000 } },
        },
      ]),
      noGrowthAssumptions
    );
    expect(result.months[0].nonHeadcountExpense).toBe(1000);
    expect(result.months[1].nonHeadcountExpense).toBe(5000); // override
    expect(result.months[2].nonHeadcountExpense).toBe(1000);
  });

  it("scheduled step changes the base amount from its month onward", () => {
    const result = buildForecast(
      4,
      "2025-01",
      zeroRevenue,
      nonHeadcount([
        {
          name: "Rent",
          category: "ops",
          amount: 1000,
          frequency: "monthly",
          startMonth: "2025-01",
          config: { method: "fixed", steps: [{ month: "2025-03", amount: 2000 }] },
        },
      ]),
      noGrowthAssumptions
    );
    expect(result.months[1].nonHeadcountExpense).toBe(1000); // Feb
    expect(result.months[2].nonHeadcountExpense).toBe(2000); // Mar onward
    expect(result.months[3].nonHeadcountExpense).toBe(2000);
  });

  it("respects start and end months for flexible costs", () => {
    const result = buildForecast(
      4,
      "2025-01",
      zeroRevenue,
      nonHeadcount([
        {
          name: "Trial tool",
          category: "ops",
          amount: 500,
          frequency: "monthly",
          startMonth: "2025-02",
          endMonth: "2025-03",
          config: { method: "growing", growthRate: 5, growthPeriod: "month", growthMode: "compound" },
        },
      ]),
      noGrowthAssumptions
    );
    expect(result.months[0].nonHeadcountExpense).toBe(0); // Jan: before start
    expect(result.months[1].nonHeadcountExpense).toBeCloseTo(500, 2); // Feb: start
    expect(result.months[2].nonHeadcountExpense).toBeCloseTo(525, 2); // Mar: +5%
    expect(result.months[3].nonHeadcountExpense).toBe(0); // Apr: after end
  });
});

describe("buildForecast headcount scaling", () => {
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
