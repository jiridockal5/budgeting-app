/**
 * Forecast Engine
 *
 * Generates month-by-month financial projections combining revenue streams,
 * expenses, and global assumptions for SaaS businesses.
 */

import {
  type CostModel,
  type CostStep,
  type RevenueBase,
  parseCostModel,
  personTypeHasEmployerTax,
} from "./expenses";

// ============================================================================
// Types
// ============================================================================

export interface PlgConfig {
  monthlyTrials: number;
  trialConversionRate: number; // percentage (8 = 8%)
  avgAcv: number; // annual contract value
  monthlyDealShare?: number; // percentage of new customers on monthly billing
  monthlyArpa?: number; // monthly revenue per monthly-billed customer
  churnRate: number; // monthly percentage
  expansionRate: number; // monthly percentage
}

export interface SalesConfig {
  monthlySqls: number;
  closeRate: number; // percentage
  avgAcv: number; // annual contract value
  monthlyDealShare?: number; // percentage of new customers on monthly billing
  monthlyArpa?: number; // monthly revenue per monthly-billed customer
  churnRate: number; // monthly percentage
  expansionRate: number; // monthly percentage
}

export interface PartnersConfig {
  monthlyReferrals: number;
  closeRate: number; // percentage
  avgAcv: number; // annual contract value
  monthlyDealShare?: number; // percentage of new customers on monthly billing
  monthlyArpa?: number; // monthly revenue per monthly-billed customer
  commissionRate: number; // percentage
}

export interface RevenueConfig {
  plg: PlgConfig;
  sales: SalesConfig;
  partners: PartnersConfig;
}

export interface HeadcountInput {
  role: string;
  type?: string; // employee | contractor | advisor (default employee)
  category: string;
  baseSalary: number; // monthly gross
  fte: number;
  startMonth: string; // "YYYY-MM"
  endMonth?: string; // last active month "YYYY-MM"
}

export interface NonHeadcountInput {
  name: string;
  category: string;
  amount: number;
  frequency: "monthly" | "annual" | "one_time";
  startMonth: string; // "YYYY-MM"
  endMonth?: string; // "YYYY-MM"
  config?: CostModel | null; // optional flexible cost model
}

export interface ExpenseInput {
  headcount: HeadcountInput[];
  nonHeadcount: NonHeadcountInput[];
}

export interface AssumptionsInput {
  cashOnHand: number;
  plannedRaiseMonth: string | null;
  plannedRaiseAmount: number | null;
  fundraisingFees: number;
  minCashBuffer: number | null;
  targetRunwayMonths: number | null;
  churnRate: number; // monthly percentage
  expansionRate: number; // monthly percentage
  paymentTimingDays: number; // average collection lag in days
  priceUplift: number | null; // annual percentage
  baseAcv: number; // annual
  salaryTaxRate: number; // percentage
  salaryGrowthRate: number; // annual percentage
  commissionRate: number; // default percentage
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
  newCustomerCashIn: number;
  existingCustomerCashIn: number;
  totalCashIn: number;

  // Expenses by category
  headcountExpense: number;
  nonHeadcountExpense: number;
  gtmExpense: number;
  totalExpense: number;

  // Burn & Runway
  netBurn: number; // positive = burning cash
  cumulativeBurn: number;
  cashRemaining: number;
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
  cashOnHand: number;
  runwayMonths: number;
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
    monthlyDealShare: 0,
    monthlyArpa: 1000,
    churnRate: 3,
    expansionRate: 5,
  },
  sales: {
    monthlySqls: 50,
    closeRate: 25,
    avgAcv: 12000,
    monthlyDealShare: 0,
    monthlyArpa: 1000,
    churnRate: 3,
    expansionRate: 5,
  },
  partners: {
    monthlyReferrals: 20,
    closeRate: 40,
    avgAcv: 12000,
    monthlyDealShare: 0,
    monthlyArpa: 1000,
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

type BillingMixConfig = {
  avgAcv: number;
  monthlyDealShare?: number;
  monthlyArpa?: number;
};

type YearlyRevenueCohort = {
  startIndex: number;
  customers: number;
  mrr: number;
};

type RevenueStreamState = {
  monthlyCustomers: number;
  yearlyCustomers: number;
  monthlyMrr: number;
  yearlyMrr: number;
  yearlyCohorts: YearlyRevenueCohort[];
};

function emptyRevenueStreamState(): RevenueStreamState {
  return {
    monthlyCustomers: 0,
    yearlyCustomers: 0,
    monthlyMrr: 0,
    yearlyMrr: 0,
    yearlyCohorts: [],
  };
}

function totalStreamCustomers(state: RevenueStreamState): number {
  return state.monthlyCustomers + state.yearlyCustomers;
}

function totalStreamMrr(state: RevenueStreamState): number {
  return state.monthlyMrr + state.yearlyMrr;
}

function splitNewCustomers(
  newCustomers: number,
  config: BillingMixConfig,
  netRevenueFactor = 1
) {
  const monthlyShare =
    Math.min(Math.max(config.monthlyDealShare ?? 0, 0), 100) / 100;
  const monthlyCustomers = newCustomers * monthlyShare;
  const yearlyCustomers = newCustomers - monthlyCustomers;
  const monthlyArpa = config.monthlyArpa ?? config.avgAcv / 12;
  const yearlyMrr = config.avgAcv / 12;

  return {
    monthlyCustomers,
    yearlyCustomers,
    monthlyMrr: monthlyCustomers * monthlyArpa * netRevenueFactor,
    yearlyMrr: yearlyCustomers * yearlyMrr * netRevenueFactor,
    monthlyCash: monthlyCustomers * monthlyArpa * netRevenueFactor,
    yearlyCash: yearlyCustomers * config.avgAcv * netRevenueFactor,
  };
}

function advanceExistingRevenue(
  state: RevenueStreamState,
  monthIndex: number,
  churnRate: number,
  expansionRate: number
) {
  const totalCustomersBefore = totalStreamCustomers(state);
  const totalMrrBefore = totalStreamMrr(state);
  const churnedCustomers =
    totalCustomersBefore > 0
      ? Math.round(totalCustomersBefore * (churnRate / 100))
      : 0;
  const customerFactor =
    totalCustomersBefore > 0
      ? Math.max(0, (totalCustomersBefore - churnedCustomers) / totalCustomersBefore)
      : 1;
  const mrrFactor = Math.max(0, 1 - churnRate / 100 + expansionRate / 100);

  state.monthlyCustomers *= customerFactor;
  state.yearlyCustomers *= customerFactor;
  state.monthlyMrr *= mrrFactor;
  state.yearlyMrr *= mrrFactor;
  state.yearlyCohorts = state.yearlyCohorts
    .map((cohort) => ({
      ...cohort,
      customers: cohort.customers * customerFactor,
      mrr: cohort.mrr * mrrFactor,
    }))
    .filter((cohort) => cohort.customers > 0 && cohort.mrr > 0);

  const yearlyRenewalCash = state.yearlyCohorts.reduce((sum, cohort) => {
    const ageMonths = monthIndex - cohort.startIndex;
    if (ageMonths > 0 && ageMonths % 12 === 0) return sum + cohort.mrr * 12;
    return sum;
  }, 0);

  return {
    churnedCustomers,
    churnedMrr: totalMrrBefore * (churnRate / 100),
    expansionMrr: totalMrrBefore * (expansionRate / 100),
    existingCash: state.monthlyMrr + yearlyRenewalCash,
  };
}

function addNewRevenue(
  state: RevenueStreamState,
  monthIndex: number,
  newCustomers: number,
  config: BillingMixConfig,
  netRevenueFactor = 1
) {
  const split = splitNewCustomers(newCustomers, config, netRevenueFactor);
  state.monthlyCustomers += split.monthlyCustomers;
  state.yearlyCustomers += split.yearlyCustomers;
  state.monthlyMrr += split.monthlyMrr;
  state.yearlyMrr += split.yearlyMrr;
  if (split.yearlyCustomers > 0 && split.yearlyMrr > 0) {
    state.yearlyCohorts.push({
      startIndex: monthIndex,
      customers: split.yearlyCustomers,
      mrr: split.yearlyMrr,
    });
  }
  return {
    newMrr: split.monthlyMrr + split.yearlyMrr,
    newCash: split.monthlyCash + split.yearlyCash,
  };
}

/** Whole months between two "YYYY-MM" strings (to - from); negative if to < from. */
export function monthDiff(from: string, to: string): number {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

// ============================================================================
// Flexible cost resolution
// ============================================================================

/**
 * Per-month inputs available to revenue-/usage-linked cost models. Built by the
 * engine after revenue and people costs for the month are known (costs can
 * depend on revenue and headcount, never the reverse).
 */
export interface MonthContext {
  date: string; // "YYYY-MM"
  monthIndex: number;
  inflationGrowth: number; // global inflation factor for the current year
  mrr: { total: number; plg: number; sales: number; partners: number };
  activeCustomers: {
    total: number;
    plg: number;
    sales: number;
    partners: number;
  };
  newCustomers: { total: number; plg: number; sales: number; partners: number };
  people: {
    totalFte: number;
    totalCount: number;
    fteByCategory: Record<string, number>;
    countByCategory: Record<string, number>;
  };
}

function mrrFor(ctx: MonthContext, base: RevenueBase): number {
  switch (base) {
    case "plg":
      return ctx.mrr.plg;
    case "sales":
      return ctx.mrr.sales;
    case "partners":
      return ctx.mrr.partners;
    default:
      return ctx.mrr.total;
  }
}

function customersFor(
  pool: MonthContext["activeCustomers"],
  base: RevenueBase
): number {
  switch (base) {
    case "plg":
      return pool.plg;
    case "sales":
      return pool.sales;
    case "partners":
      return pool.partners;
    default:
      return pool.total;
  }
}

/** Latest step whose month is on/before `date`, if any. */
function effectiveStep(steps: CostStep[] | undefined, date: string): CostStep | undefined {
  if (!steps?.length) return undefined;
  let best: CostStep | undefined;
  for (const step of steps) {
    if (step.month <= date && (!best || step.month > best.month)) best = step;
  }
  return best;
}

/**
 * Resolve the cost of a single non-people expense for one month.
 *
 * Precedence: outside [start, end] -> 0; explicit per-month override; otherwise
 * the selected method applied to the effective base (latest step, else amount).
 * A null/absent config behaves exactly like the legacy fixed-amount path.
 */
export function resolveExpenseMonth(
  expense: NonHeadcountInput,
  ctx: MonthContext
): number {
  const { date } = ctx;
  if (date < expense.startMonth) return 0;
  if (expense.endMonth && date > expense.endMonth) return 0;

  const model = parseCostModel(expense.config ?? null);

  // 1. Explicit per-month override always wins.
  const override = model?.overrides?.[date];
  if (override != null) return override;

  // 2. Effective base amount (scheduled step overrides the line amount).
  const step = effectiveStep(model?.steps, date);
  const base = step ? step.amount : expense.amount;

  const method = model?.method ?? "fixed";

  switch (method) {
    case "growing": {
      const m = model as Extract<CostModel, { method: "growing" }>;
      const elapsed = Math.max(0, monthDiff(expense.startMonth, date));
      const periods =
        m.growthPeriod === "month" ? elapsed : Math.floor(elapsed / 12);
      const r = m.growthRate / 100;
      const factor =
        m.growthMode === "linear" ? 1 + r * periods : Math.pow(1 + r, periods);
      return base * factor;
    }
    case "percentOfRevenue": {
      const m = model as Extract<CostModel, { method: "percentOfRevenue" }>;
      return mrrFor(ctx, m.revenueBase) * (m.percent / 100);
    }
    case "perCustomer": {
      const m = model as Extract<CostModel, { method: "perCustomer" }>;
      const pool =
        m.customerBasis === "new" ? ctx.newCustomers : ctx.activeCustomers;
      return customersFor(pool, m.stream ?? "total") * m.amountPerUnit;
    }
    case "perEmployee": {
      const m = model as Extract<CostModel, { method: "perEmployee" }>;
      if (m.employeeBasis === "count") {
        const count = m.employeeCategory
          ? ctx.people.countByCategory[m.employeeCategory] ?? 0
          : ctx.people.totalCount;
        return count * m.amountPerUnit;
      }
      const fte = m.employeeCategory
        ? ctx.people.fteByCategory[m.employeeCategory] ?? 0
        : ctx.people.totalFte;
      return fte * m.amountPerUnit;
    }
    case "fixed":
    default: {
      const adjusted = base * ctx.inflationGrowth;
      if (expense.frequency === "annual") return adjusted / 12;
      if (expense.frequency === "one_time")
        return date === expense.startMonth ? adjusted : 0;
      return adjusted; // monthly
    }
  }
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

  // TODO: Apply minCashBuffer and targetRunwayMonths to summary recommendations
  // (suggested raise needed, cash-out warnings).
  // TODO: Apply priceUplift to pricing.
  // TODO: Use commissionRate as a default for incentive-based roles when role-level logic exists.

  const plgState = emptyRevenueStreamState();
  const salesState = emptyRevenueStreamState();
  const partnerState = emptyRevenueStreamState();
  let cumulativeBurn = 0;
  const collectionLagMonths = Math.max(
    0,
    Math.round(assumptions.paymentTimingDays / 30)
  );
  const pendingNewCustomerCash: number[] = Array(numMonths).fill(0);
  const pendingExistingCustomerCash: number[] = Array(numMonths).fill(0);

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

    // ── Existing revenue, churn, expansion, and cash collection ──
    const plgExisting = advanceExistingRevenue(
      plgState,
      i,
      revenue.plg.churnRate,
      revenue.plg.expansionRate
    );
    const salesExisting = advanceExistingRevenue(
      salesState,
      i,
      revenue.sales.churnRate,
      revenue.sales.expansionRate
    );
    const partnerExisting = advanceExistingRevenue(
      partnerState,
      i,
      assumptions.churnRate,
      0
    );

    // ── New MRR and cash from new customers ──
    const newPlg = addNewRevenue(plgState, i, newPlgCustomers, revenue.plg);
    const newSales = addNewRevenue(
      salesState,
      i,
      newSalesCustomers,
      revenue.sales
    );
    const newPartner = addNewRevenue(
      partnerState,
      i,
      newPartnerCustomers,
      revenue.partners,
      1 - revenue.partners.commissionRate / 100
    );

    const cashCollectionMonth = i + collectionLagMonths;
    if (cashCollectionMonth < numMonths) {
      pendingNewCustomerCash[cashCollectionMonth] +=
        newPlg.newCash + newSales.newCash + newPartner.newCash;
      pendingExistingCustomerCash[cashCollectionMonth] +=
        plgExisting.existingCash +
        salesExisting.existingCash +
        partnerExisting.existingCash;
    }

    const plgMrr = totalStreamMrr(plgState);
    const salesMrr = totalStreamMrr(salesState);
    const partnerMrr = totalStreamMrr(partnerState);
    const plgCustomers = Math.round(totalStreamCustomers(plgState));
    const salesCustomers = Math.round(totalStreamCustomers(salesState));
    const partnerCustomers = Math.round(totalStreamCustomers(partnerState));
    const totalMrr = plgMrr + salesMrr + partnerMrr;
    const totalArr = totalMrr * 12;
    const totalCustomers = plgCustomers + salesCustomers + partnerCustomers;

    const churnedMrr =
      plgExisting.churnedMrr +
      salesExisting.churnedMrr +
      partnerExisting.churnedMrr;
    const expansionMrr =
      plgExisting.expansionMrr + salesExisting.expansionMrr;
    const newMrr = newPlg.newMrr + newSales.newMrr + newPartner.newMrr;
    const newCustomerCashIn = pendingNewCustomerCash[i] ?? 0;
    const existingCustomerCashIn = pendingExistingCustomerCash[i] ?? 0;
    const totalCashIn = newCustomerCashIn + existingCustomerCashIn;

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

    // People costs (employees, contractors, advisors)
    let headcountExpense = 0;
    let gtmHeadcountExpense = 0;
    let totalFte = 0;
    let totalHeadcount = 0;
    const fteByCategory: Record<string, number> = {};
    const countByCategory: Record<string, number> = {};
    for (const person of expenses.headcount) {
      if (date < person.startMonth) continue;
      if (person.endMonth && date > person.endMonth) continue;

      const adjusted = person.baseSalary * salaryGrowth;
      const taxed = personTypeHasEmployerTax(person.type ?? "employee")
        ? adjusted * (1 + assumptions.salaryTaxRate / 100)
        : adjusted;
      const cost = taxed * person.fte;

      headcountExpense += cost;
      if (person.category === "gtm") gtmHeadcountExpense += cost;

      totalFte += person.fte;
      totalHeadcount += 1;
      fteByCategory[person.category] =
        (fteByCategory[person.category] ?? 0) + person.fte;
      countByCategory[person.category] =
        (countByCategory[person.category] ?? 0) + 1;
    }

    // Context for revenue-/usage-linked non-people costs
    const monthContext: MonthContext = {
      date,
      monthIndex: i,
      inflationGrowth,
      mrr: { total: totalMrr, plg: plgMrr, sales: salesMrr, partners: partnerMrr },
      activeCustomers: {
        total: totalCustomers,
        plg: plgCustomers,
        sales: salesCustomers,
        partners: partnerCustomers,
      },
      newCustomers: {
        total: newPlgCustomers + newSalesCustomers + newPartnerCustomers,
        plg: newPlgCustomers,
        sales: newSalesCustomers,
        partners: newPartnerCustomers,
      },
      people: {
        totalFte,
        totalCount: totalHeadcount,
        fteByCategory,
        countByCategory,
      },
    };

    // Non-people costs (flexible cost model; fixed-amount fallback)
    let nonHeadcountExpense = 0;
    let gtmNonHeadcountExpense = 0;
    for (const expense of expenses.nonHeadcount) {
      const monthCost = resolveExpenseMonth(expense, monthContext);
      if (monthCost === 0) continue;
      nonHeadcountExpense += monthCost;
      if (expense.category === "gtm") gtmNonHeadcountExpense += monthCost;
    }

    const gtmExpense = gtmHeadcountExpense + gtmNonHeadcountExpense;

    const totalExpense = headcountExpense + nonHeadcountExpense;
    const netBurn = totalExpense - totalCashIn;

    let raiseInjection = 0;
    if (
      assumptions.plannedRaiseMonth &&
      assumptions.plannedRaiseAmount &&
      date === assumptions.plannedRaiseMonth
    ) {
      raiseInjection =
        assumptions.plannedRaiseAmount * (1 - assumptions.fundraisingFees / 100);
    }

    cumulativeBurn += netBurn - raiseInjection;
    const cashRemaining = assumptions.cashOnHand - cumulativeBurn;

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
      newCustomerCashIn: round2(newCustomerCashIn),
      existingCustomerCashIn: round2(existingCustomerCashIn),
      totalCashIn: round2(totalCashIn),
      headcountExpense: round2(headcountExpense),
      nonHeadcountExpense: round2(nonHeadcountExpense),
      gtmExpense: round2(gtmExpense),
      totalExpense: round2(totalExpense),
      netBurn: round2(netBurn),
      cumulativeBurn: round2(cumulativeBurn),
      cashRemaining: round2(cashRemaining),
    });
  }

  const summary = computeSummary(months, assumptions);
  return { months, summary };
}

// ============================================================================
// Summary Metrics
// ============================================================================

export function computeSummary(
  months: ForecastMonth[],
  assumptions: AssumptionsInput
): ForecastSummary {
  if (months.length === 0) {
    return {
      projectedArr: 0,
      projectedMrr: 0,
      annualNrr: 100,
      annualGrr: 100,
      cac: 0,
      cacPaybackMonths: 0,
      ltvCacRatio: 0,
      monthlyBurn: 0,
      burnMultiple: 0,
      netNewArr: 0,
      totalCustomers: 0,
      ruleOf40: 0,
      cashOnHand: assumptions.cashOnHand,
      runwayMonths: assumptions.cashOnHand > 0 ? Infinity : 0,
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

  // CAC = total GTM spend / total new customers across the forecast
  const totalGtmSpend = months.reduce((sum, m) => sum + m.gtmExpense, 0);
  const totalNewCustomers = months.reduce(
    (sum, m) => sum + m.newPlgCustomers + m.newSalesCustomers + m.newPartnerCustomers,
    0
  );
  const cac = totalNewCustomers > 0 ? totalGtmSpend / totalNewCustomers : 0;

  // Average MRR per customer
  const avgMrrPerCustomer =
    last.totalCustomers > 0
      ? last.totalMrr / last.totalCustomers
      : assumptions.baseAcv / 12;

  // CAC payback in months
  const cacPayback =
    avgMrrPerCustomer > 0 ? cac / avgMrrPerCustomer : 0;

  // LTV = ARPA / monthly churn, then LTV / CAC
  const ltv =
    monthlyChurn > 0
      ? avgMrrPerCustomer / monthlyChurn
      : avgMrrPerCustomer * 60;
  const ltvCac = cac > 0 ? ltv / cac : 0;

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

  const runwayIdx = months.findIndex((m) => m.cashRemaining <= 0);
  const runwayMonths =
    runwayIdx >= 0
      ? runwayIdx
      : monthlyBurn > 0
        ? months.length + last.cashRemaining / monthlyBurn
        : Infinity;

  return {
    projectedArr: round2(last.totalArr),
    projectedMrr: round2(last.totalMrr),
    annualNrr: round2(annualNrr),
    annualGrr: round2(annualGrr),
    cac: round2(cac),
    cacPaybackMonths: round2(cacPayback),
    ltvCacRatio: round2(ltvCac),
    monthlyBurn: round2(monthlyBurn),
    burnMultiple: round2(Math.abs(burnMultiple)),
    netNewArr: round2(netNewArr),
    totalCustomers: last.totalCustomers,
    ruleOf40: round2(ruleOf40),
    cashOnHand: assumptions.cashOnHand,
    runwayMonths: round2(runwayMonths === Infinity ? 999 : runwayMonths),
  };
}
