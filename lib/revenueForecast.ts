/**
 * Forecast Engine
 *
 * Generates month-by-month financial projections combining revenue streams,
 * expenses, and global assumptions for SaaS businesses.
 */

// ============================================================================
// Types
// ============================================================================

export interface PlgConfig {
  monthlyTrials: number;
  trialConversionRate: number; // percentage (8 = 8%)
  avgAcv: number; // annual contract value
  churnRate: number; // monthly percentage
  expansionRate: number; // monthly percentage
}

export interface SalesConfig {
  monthlySqls: number;
  closeRate: number; // percentage
  avgAcv: number; // annual contract value
  churnRate: number; // monthly percentage
  expansionRate: number; // monthly percentage
}

export interface PartnersConfig {
  monthlyReferrals: number;
  closeRate: number; // percentage
  avgAcv: number; // annual contract value
  commissionRate: number; // percentage
}

export interface RevenueConfig {
  plg: PlgConfig;
  sales: SalesConfig;
  partners: PartnersConfig;
}

export interface HeadcountInput {
  role: string;
  category: string;
  baseSalary: number; // monthly gross
  fte: number;
  startMonth: string; // "YYYY-MM"
}

export interface NonHeadcountInput {
  name: string;
  category: string;
  amount: number;
  frequency: "monthly" | "annual" | "one_time";
  startMonth: string; // "YYYY-MM"
  endMonth?: string; // "YYYY-MM"
}

export interface ExpenseInput {
  headcount: HeadcountInput[];
  nonHeadcount: NonHeadcountInput[];
}

export interface AssumptionsInput {
  cac: number;
  churnRate: number; // monthly percentage
  expansionRate: number; // monthly percentage
  baseAcv: number; // annual
  salaryTaxRate: number; // percentage
  salaryGrowthRate: number; // annual percentage
  inflationRate: number; // annual percentage
}

export interface ForecastMonth {
  monthIndex: number;
  date: string; // "YYYY-MM"

  // Revenue
  plgMrr: number;
  salesMrr: number;
  partnerMrr: number;
  totalMrr: number;
  totalArr: number;

  // Customer counts
  plgCustomers: number;
  salesCustomers: number;
  partnerCustomers: number;
  totalCustomers: number;

  // Monthly changes
  newPlgCustomers: number;
  newSalesCustomers: number;
  newPartnerCustomers: number;
  churnedMrr: number;
  expansionMrr: number;
  newMrr: number;

  // Expenses by category
  headcountExpense: number;
  nonHeadcountExpense: number;
  totalExpense: number;

  // Burn
  netBurn: number; // positive = burning cash
  cumulativeBurn: number;
}

export interface ForecastSummary {
  projectedArr: number;
  projectedMrr: number;
  annualNrr: number;
  annualGrr: number;
  cac: number;
  cacPaybackMonths: number;
  ltvCacRatio: number;
  monthlyBurn: number;
  burnMultiple: number;
  netNewArr: number;
  totalCustomers: number;
  ruleOf40: number;
}

export interface ForecastResult {
  months: ForecastMonth[];
  summary: ForecastSummary;
}

// ============================================================================
// Default Revenue Config
// ============================================================================

export const DEFAULT_REVENUE_CONFIG: RevenueConfig = {
  plg: {
    monthlyTrials: 500,
    trialConversionRate: 8,
    avgAcv: 12000,
    churnRate: 3,
    expansionRate: 5,
  },
  sales: {
    monthlySqls: 50,
    closeRate: 25,
    avgAcv: 12000,
    churnRate: 3,
    expansionRate: 5,
  },
  partners: {
    monthlyReferrals: 20,
    closeRate: 40,
    avgAcv: 12000,
    commissionRate: 20,
  },
};

// ============================================================================
// Helpers
// ============================================================================

/** Add N months to a "YYYY-MM" string and return a new "YYYY-MM" string */
export function addMonths(startMonth: string, count: number): string {
  const [year, month] = startMonth.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1 + count, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Convert a Date or ISO string to "YYYY-MM" */
export function dateToMonth(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ============================================================================
// Forecast Engine
// ============================================================================

/**
 * Build a complete financial forecast for a SaaS business.
 *
 * @param numMonths - Number of months to project
 * @param startMonth - First month of forecast ("YYYY-MM")
 * @param revenue - Revenue stream configurations
 * @param expenses - Headcount and non-headcount expenses
 * @param assumptions - Global financial assumptions
 * @returns Month-by-month projections and summary metrics
 */
export function buildForecast(
  numMonths: number,
  startMonth: string,
  revenue: RevenueConfig,
  expenses: ExpenseInput,
  assumptions: AssumptionsInput
): ForecastResult {
  const months: ForecastMonth[] = [];

  let plgCustomers = 0;
  let salesCustomers = 0;
  let partnerCustomers = 0;
  let plgMrr = 0;
  let salesMrr = 0;
  let partnerMrr = 0;
  let cumulativeBurn = 0;

  for (let i = 0; i < numMonths; i++) {
    const date = addMonths(startMonth, i);

    // ── New customers this month ──
    const newPlgCustomers = Math.round(
      revenue.plg.monthlyTrials * (revenue.plg.trialConversionRate / 100)
    );
    const newSalesCustomers = Math.round(
      revenue.sales.monthlySqls * (revenue.sales.closeRate / 100)
    );
    const newPartnerCustomers = Math.round(
      revenue.partners.monthlyReferrals * (revenue.partners.closeRate / 100)
    );

    // ── New MRR from new customers ──
    const newPlgMrr = newPlgCustomers * (revenue.plg.avgAcv / 12);
    const newSalesMrr = newSalesCustomers * (revenue.sales.avgAcv / 12);
    const newPartnerMrr =
      newPartnerCustomers *
      (revenue.partners.avgAcv / 12) *
      (1 - revenue.partners.commissionRate / 100);

    // ── Churn on existing MRR ──
    const plgChurn = plgMrr * (revenue.plg.churnRate / 100);
    const salesChurn = salesMrr * (revenue.sales.churnRate / 100);
    const partnerChurn = partnerMrr * (assumptions.churnRate / 100);

    // ── Expansion on existing MRR ──
    const plgExpansion = plgMrr * (revenue.plg.expansionRate / 100);
    const salesExpansion = salesMrr * (revenue.sales.expansionRate / 100);

    // ── Update MRR ──
    plgMrr = Math.max(0, plgMrr - plgChurn + plgExpansion + newPlgMrr);
    salesMrr = Math.max(0, salesMrr - salesChurn + salesExpansion + newSalesMrr);
    partnerMrr = Math.max(0, partnerMrr - partnerChurn + newPartnerMrr);

    // ── Update customer counts ──
    const plgChurnedCust =
      plgCustomers > 0
        ? Math.round(plgCustomers * (revenue.plg.churnRate / 100))
        : 0;
    const salesChurnedCust =
      salesCustomers > 0
        ? Math.round(salesCustomers * (revenue.sales.churnRate / 100))
        : 0;
    const partnerChurnedCust =
      partnerCustomers > 0
        ? Math.round(partnerCustomers * (assumptions.churnRate / 100))
        : 0;

    plgCustomers = Math.max(0, plgCustomers + newPlgCustomers - plgChurnedCust);
    salesCustomers = Math.max(
      0,
      salesCustomers + newSalesCustomers - salesChurnedCust
    );
    partnerCustomers = Math.max(
      0,
      partnerCustomers + newPartnerCustomers - partnerChurnedCust
    );

    const totalMrr = plgMrr + salesMrr + partnerMrr;
    const totalArr = totalMrr * 12;
    const totalCustomers = plgCustomers + salesCustomers + partnerCustomers;

    const churnedMrr = plgChurn + salesChurn + partnerChurn;
    const expansionMrr = plgExpansion + salesExpansion;
    const newMrr = newPlgMrr + newSalesMrr + newPartnerMrr;

    // ── Expenses ──
    const yearIndex = Math.floor(i / 12);
    const salaryGrowth = Math.pow(
      1 + assumptions.salaryGrowthRate / 100,
      yearIndex
    );
    const inflationGrowth = Math.pow(
      1 + assumptions.inflationRate / 100,
      yearIndex
    );

    let headcountExpense = 0;
    for (const person of expenses.headcount) {
      if (date >= person.startMonth) {
        const adjusted = person.baseSalary * salaryGrowth;
        const withTax = adjusted * (1 + assumptions.salaryTaxRate / 100);
        headcountExpense += withTax * person.fte;
      }
    }

    let nonHeadcountExpense = 0;
    for (const expense of expenses.nonHeadcount) {
      if (date < expense.startMonth) continue;
      if (expense.endMonth && date > expense.endMonth) continue;

      const adjusted = expense.amount * inflationGrowth;

      if (expense.frequency === "monthly") {
        nonHeadcountExpense += adjusted;
      } else if (expense.frequency === "annual") {
        nonHeadcountExpense += adjusted / 12;
      } else if (expense.frequency === "one_time") {
        if (date === expense.startMonth) {
          nonHeadcountExpense += adjusted;
        }
      }
    }

    const totalExpense = headcountExpense + nonHeadcountExpense;
    const netBurn = totalExpense - totalMrr;
    cumulativeBurn += netBurn;

    months.push({
      monthIndex: i,
      date,
      plgMrr: round2(plgMrr),
      salesMrr: round2(salesMrr),
      partnerMrr: round2(partnerMrr),
      totalMrr: round2(totalMrr),
      totalArr: round2(totalArr),
      plgCustomers,
      salesCustomers,
      partnerCustomers,
      totalCustomers,
      newPlgCustomers,
      newSalesCustomers,
      newPartnerCustomers,
      churnedMrr: round2(churnedMrr),
      expansionMrr: round2(expansionMrr),
      newMrr: round2(newMrr),
      headcountExpense: round2(headcountExpense),
      nonHeadcountExpense: round2(nonHeadcountExpense),
      totalExpense: round2(totalExpense),
      netBurn: round2(netBurn),
      cumulativeBurn: round2(cumulativeBurn),
    });
  }

  const summary = computeSummary(months, assumptions);
  return { months, summary };
}

// ============================================================================
// Summary Metrics
// ============================================================================

function computeSummary(
  months: ForecastMonth[],
  assumptions: AssumptionsInput
): ForecastSummary {
  if (months.length === 0) {
    return {
      projectedArr: 0,
      projectedMrr: 0,
      annualNrr: 100,
      annualGrr: 100,
      cac: assumptions.cac,
      cacPaybackMonths: 0,
      ltvCacRatio: 0,
      monthlyBurn: 0,
      burnMultiple: 0,
      netNewArr: 0,
      totalCustomers: 0,
      ruleOf40: 0,
    };
  }

  const last = months[months.length - 1];
  const first = months[0];

  // Blended monthly churn and expansion
  const monthlyChurn = assumptions.churnRate / 100;
  const monthlyExpansion = assumptions.expansionRate / 100;

  // NRR and GRR (annualized from monthly rates)
  const annualNrr = Math.pow(1 + monthlyExpansion - monthlyChurn, 12) * 100;
  const annualGrr = Math.pow(1 - monthlyChurn, 12) * 100;

  // Average MRR per customer
  const avgMrrPerCustomer =
    last.totalCustomers > 0
      ? last.totalMrr / last.totalCustomers
      : assumptions.baseAcv / 12;

  // CAC payback in months
  const cacPayback =
    avgMrrPerCustomer > 0 ? assumptions.cac / avgMrrPerCustomer : 0;

  // LTV = ARPA / monthly churn, then LTV / CAC
  const ltv =
    monthlyChurn > 0
      ? avgMrrPerCustomer / monthlyChurn
      : avgMrrPerCustomer * 60;
  const ltvCac = assumptions.cac > 0 ? ltv / assumptions.cac : 0;

  // Monthly burn (last month)
  const monthlyBurn = last.netBurn;

  // Net new ARR over forecast period
  const netNewArr = last.totalArr - first.totalArr;

  // Burn Multiple = |annual burn| / net new ARR
  const annualBurn = Math.abs(monthlyBurn) * 12;
  const burnMultiple = netNewArr > 0 ? annualBurn / netNewArr : 0;

  // Rule of 40: annualized MRR growth % + profit margin %
  const mrrGrowthRate =
    months.length > 1 && first.totalMrr > 0
      ? ((last.totalMrr - first.totalMrr) / first.totalMrr) * 100
      : last.totalMrr > 0
        ? 100
        : 0;
  const profitMargin =
    last.totalMrr > 0
      ? ((last.totalMrr - last.totalExpense) / last.totalMrr) * 100
      : -100;
  const ruleOf40 = mrrGrowthRate + profitMargin;

  return {
    projectedArr: round2(last.totalArr),
    projectedMrr: round2(last.totalMrr),
    annualNrr: round2(annualNrr),
    annualGrr: round2(annualGrr),
    cac: assumptions.cac,
    cacPaybackMonths: round2(cacPayback),
    ltvCacRatio: round2(ltvCac),
    monthlyBurn: round2(monthlyBurn),
    burnMultiple: round2(Math.abs(burnMultiple)),
    netNewArr: round2(netNewArr),
    totalCustomers: last.totalCustomers,
    ruleOf40: round2(ruleOf40),
  };
}
