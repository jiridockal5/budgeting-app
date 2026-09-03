/**
 * Forecast Engine
 *
 * Generates month-by-month financial projections combining revenue streams,
 * expenses, and global assumptions for SaaS businesses.
 */

import {
  type CostModel,
  type CostStep,
  type ExpenseCategory,
  type RevenueBase,
  EXPENSE_CATEGORIES,
  parseCostModel,
  personTypeHasEmployerTax,
} from "./expenses";

// ============================================================================
// Types
// ============================================================================

export interface PlgConfig {
  monthlyTrials: number;
  trialConversionRate: number; // percentage (8 = 8%)
  avgAcv: number; // annual contract value (MRR = ACV / 12)
  monthlyDealShare?: number; // % of new customers on monthly billing (cash timing only)
  churnRate: number; // monthly percentage
  expansionRate: number; // monthly percentage
  /** Customers already on the books at forecast start (pre-raise). */
  startingCustomers?: number;
  /** Current MRR already on the books at forecast start (pre-raise). */
  startingMrr?: number;
}

/** One self-service offering. Several plans are simulated separately, then summed into PLG totals. */
export interface PlgPlanConfig extends PlgConfig {
  id: string;
  name: string;
}

export interface SalesConfig {
  monthlySqls: number;
  closeRate: number; // percentage
  avgAcv: number; // annual contract value (all sales deals)
  churnRate: number; // monthly percentage
  expansionRate: number; // monthly percentage
  startingCustomers?: number;
  startingMrr?: number;
}

export interface PartnersConfig {
  monthlyReferrals: number;
  closeRate: number; // percentage
  avgAcv: number; // annual contract value (MRR = ACV / 12)
  monthlyDealShare?: number; // % of new customers on monthly billing (cash timing only)
  commissionRate: number; // percentage
  startingCustomers?: number;
  startingMrr?: number;
}

export interface RevenueConfig {
  /** Aggregated PLG snapshot (starting book, and a single plan when only one exists). */
  plg: PlgConfig;
  /** Self-service plans. Each is an input stream; forecast PLG outputs are the sum. */
  plgPlans?: PlgPlanConfig[];
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
  fundraisingCashIn: number;

  // Expenses by category (headcount + non-headcount combined)
  headcountExpense: number;
  nonHeadcountExpense: number;
  cosExpense: number;
  gtmExpense: number;
  rndExpense: number;
  csExpense: number;
  opsExpense: number;
  totalExpense: number;

  // P&L (accrual, MRR basis)
  grossProfit: number;
  grossMarginPct: number;
  operatingExpenses: number;
  ebit: number;
  ebitMarginPct: number;

  // Burn & Runway
  netBurn: number; // positive = burning cash
  cumulativeBurn: number;
  cashRemaining: number;
}

export interface NetNewArrMix {
  newPct: number;
  expansionPct: number;
  churnPct: number;
}

export interface ForecastSummary {
  projectedArr: number;
  projectedMrr: number;
  annualNrr: number;
  annualGrr: number;
  cac: number;
  cacPaybackMonths: number;
  ltv: number;
  ltvCacRatio: number;
  monthlyBurn: number;
  burnMultiple: number;
  netNewArr: number;
  totalCustomers: number;
  ruleOf40: number;
  cashOnHand: number;
  runwayMonths: number;
  // SaaS metrics
  mrrGrowthRate: number;
  arrGrowthRate: number;
  arpa: number;
  quickRatio: number;
  salesEfficiency: number;
  magicNumber: number | null;
  rndPctOfRevenue: number;
  netNewArrMix: NetNewArrMix;
  totalNewMrr: number;
  totalExpansionMrr: number;
  totalChurnedMrr: number;
  // Financial / P&L (end of period)
  grossProfit: number;
  grossMarginPct: number;
  ebit: number;
  ebitMarginPct: number;
  operatingExpenses: number;
  expenseByCategory: Record<ExpenseCategory, number>;
}

export interface StartingRunRate {
  date: string; // plan start month "YYYY-MM"
  currentMrr: number;
  currentCustomers: number;
  /** In-place Cost of Sales (people + non-people) at plan start. */
  currentCos: number;
  /** In-place operating expenses excluding COS (GTM, R&D, CS, Ops). */
  currentOpex: number;
  /** COS + opex: all cash costs active at plan start. */
  currentCosts: number;
  netBurn: number; // (COS + opex) − opening MRR
  cashOnHand: number;
  /** Months of cash at current burn, excluding the planned raise. 999 if not burning. */
  runwayMonths: number;
  /** Planned raise month when a net raise (after fees) is scheduled at or after start. */
  plannedRaiseMonth: string | null;
  /**
   * Planned raise month when that raise lands before cash would hit zero at
   * current burn. Null if there is no raise, or it arrives too late.
   */
  raiseBridgesUntilMonth: string | null;
}

export interface ForecastResult {
  months: ForecastMonth[];
  summary: ForecastSummary;
  startingRunRate: StartingRunRate;
}

// ============================================================================
// Default Revenue Config
// ============================================================================

export const DEFAULT_PLG_CONFIG: PlgConfig = {
  monthlyTrials: 0,
  trialConversionRate: 0,
  avgAcv: 0,
  monthlyDealShare: 0,
  churnRate: 0,
  expansionRate: 0,
  startingCustomers: 0,
  startingMrr: 0,
};

export const DEFAULT_PLG_PLAN: PlgPlanConfig = {
  id: "plg-1",
  name: "Self-service",
  ...DEFAULT_PLG_CONFIG,
};

export const DEFAULT_REVENUE_CONFIG: RevenueConfig = {
  plg: { ...DEFAULT_PLG_CONFIG },
  plgPlans: [{ ...DEFAULT_PLG_PLAN }],
  sales: {
    monthlySqls: 0,
    closeRate: 0,
    avgAcv: 0,
    churnRate: 0,
    expansionRate: 0,
    startingCustomers: 0,
    startingMrr: 0,
  },
  partners: {
    monthlyReferrals: 0,
    closeRate: 0,
    avgAcv: 0,
    monthlyDealShare: 0,
    commissionRate: 0,
    startingCustomers: 0,
    startingMrr: 0,
  },
};

export function createPlgPlan(index: number): PlgPlanConfig {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `plg-${Date.now()}-${index}`;
  return {
    ...DEFAULT_PLG_CONFIG,
    id,
    name: defaultPlgPlanName(index),
  };
}

function numOrZero(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function defaultPlgPlanName(index: number): string {
  return index === 0 ? "Self-service" : `Self-service ${index + 1}`;
}

export function stripPlgPlanMeta(plan: PlgPlanConfig): PlgConfig {
  return {
    monthlyTrials: plan.monthlyTrials,
    trialConversionRate: plan.trialConversionRate,
    avgAcv: plan.avgAcv,
    monthlyDealShare: plan.monthlyDealShare,
    churnRate: plan.churnRate,
    expansionRate: plan.expansionRate,
    startingCustomers: plan.startingCustomers,
    startingMrr: plan.startingMrr,
  };
}

export function aggregatePlgFromPlans(plans: PlgPlanConfig[]): PlgConfig {
  if (plans.length === 0) return { ...DEFAULT_PLG_CONFIG };
  if (plans.length === 1) return stripPlgPlanMeta(plans[0]);
  return {
    ...DEFAULT_PLG_CONFIG,
    monthlyTrials: plans.reduce((sum, plan) => sum + plan.monthlyTrials, 0),
    startingCustomers: plans.reduce(
      (sum, plan) => sum + openingAmount(plan.startingCustomers),
      0
    ),
    startingMrr: plans.reduce(
      (sum, plan) => sum + openingAmount(plan.startingMrr),
      0
    ),
  };
}

function normalizePlgFields(value: Partial<PlgConfig> | null | undefined): PlgConfig {
  return { ...DEFAULT_PLG_CONFIG, ...(value ?? {}) };
}

export function normalizePlgPlan(
  value: Partial<PlgPlanConfig> | null | undefined,
  index: number
): PlgPlanConfig {
  const raw = value ?? {};
  const name =
    typeof raw.name === "string" && raw.name.trim()
      ? raw.name.trim()
      : defaultPlgPlanName(index);
  const id =
    typeof raw.id === "string" && raw.id.trim()
      ? raw.id.trim()
      : `plg-${index + 1}`;
  return {
    ...normalizePlgFields(raw),
    id,
    name,
  };
}

/** Plans to simulate. Falls back to the legacy single `plg` object. */
export function getPlgPlans(revenue: RevenueConfig): PlgPlanConfig[] {
  if (Array.isArray(revenue.plgPlans) && revenue.plgPlans.length > 0) {
    return revenue.plgPlans.map((plan, index) => normalizePlgPlan(plan, index));
  }
  return [normalizePlgPlan({ ...revenue.plg, id: "plg-1", name: "Self-service" }, 0)];
}

export function withPlgPlans(
  revenue: RevenueConfig,
  plans: PlgPlanConfig[]
): RevenueConfig {
  const normalized =
    plans.length > 0
      ? plans.map((plan, index) => normalizePlgPlan(plan, index))
      : [{ ...DEFAULT_PLG_PLAN }];
  return {
    ...revenue,
    plgPlans: normalized,
    plg: aggregatePlgFromPlans(normalized),
  };
}

/** Fill missing stream fields so older saved JSON still loads cleanly. */
export function normalizeRevenueConfig(
  config: Partial<RevenueConfig> | null | undefined
): RevenueConfig {
  const sales = { ...DEFAULT_REVENUE_CONFIG.sales, ...(config?.sales ?? {}) };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructured to omit legacy field
  const { monthlyArpa: _legacyMonthlyArpa, ...partnersRest } = {
    ...DEFAULT_REVENUE_CONFIG.partners,
    ...(config?.partners ?? {}),
  } as PartnersConfig & { monthlyArpa?: number };
  const partners = partnersRest;
  const rawPlans = Array.isArray(config?.plgPlans) ? config.plgPlans : null;
  const plgPlans =
    rawPlans && rawPlans.length > 0
      ? rawPlans.map((plan, index) => normalizePlgPlan(plan, index))
      : [
          normalizePlgPlan(
            {
              ...DEFAULT_PLG_CONFIG,
              ...(config?.plg ?? {}),
              id: "plg-1",
              name: "Self-service",
            },
            0
          ),
        ];
  return {
    plg: aggregatePlgFromPlans(plgPlans),
    plgPlans,
    sales,
    partners,
  };
}

function isBlankNumericStream(stream: object): boolean {
  return Object.entries(stream).every(
    ([key, value]) =>
      key === "id" ||
      key === "name" ||
      value === 0 ||
      value === undefined
  );
}

/** True when revenue config has no real funnel/pricing inputs yet. */
export function isBlankRevenueConfig(
  config: RevenueConfig | null | undefined
): boolean {
  if (!config) return true;
  const plgBlank = getPlgPlans(config).every(isBlankNumericStream);
  return (
    plgBlank &&
    isBlankNumericStream(config.sales) &&
    isBlankNumericStream(config.partners)
  );
}

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

function openingAmount(value: number | undefined): number {
  return Math.max(0, numOrZero(value));
}

/**
 * Seed the current book at forecast start.
 * Current MRR is a monthly cash run-rate (what the company collects today).
 * New-business monthly/yearly mix does not apply to this opening book.
 */
function seedOpeningBook(
  startingCustomers: number | undefined,
  startingMrr: number | undefined
): RevenueStreamState {
  const customers = openingAmount(startingCustomers);
  const mrr = openingAmount(startingMrr);
  if (customers === 0 && mrr === 0) return emptyRevenueStreamState();

  return {
    monthlyCustomers: customers,
    yearlyCustomers: 0,
    monthlyMrr: mrr,
    yearlyMrr: 0,
    yearlyCohorts: [],
  };
}

/** Month-0 cash from the opening book: full current MRR; no churn. */
function openingBookCash(state: RevenueStreamState) {
  return {
    churnedCustomers: 0,
    churnedMrr: 0,
    expansionMrr: 0,
    existingCash: totalStreamMrr(state),
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
  const mrrPerCustomer = (config.avgAcv / 12) * netRevenueFactor;

  return {
    monthlyCustomers,
    yearlyCustomers,
    monthlyMrr: monthlyCustomers * mrrPerCustomer,
    yearlyMrr: yearlyCustomers * mrrPerCustomer,
    monthlyCash: monthlyCustomers * mrrPerCustomer,
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
  /** New sales-sourced closed ACV this month (new sales customers × avgAcv). Not MRR, not opening book. */
  newSalesBookings: number;
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
    case "percentOfNewSalesBookings": {
      const m = model as Extract<CostModel, { method: "percentOfNewSalesBookings" }>;
      return ctx.newSalesBookings * (m.percent / 100);
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

  const plgPlans = getPlgPlans(revenue);
  const plgStates = plgPlans.map((plan) =>
    seedOpeningBook(plan.startingCustomers, plan.startingMrr)
  );
  const salesState = seedOpeningBook(
    revenue.sales.startingCustomers,
    revenue.sales.startingMrr
  );
  const partnerState = seedOpeningBook(
    revenue.partners.startingCustomers,
    revenue.partners.startingMrr
  );
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
    let newPlgCustomers = 0;
    const plgExisting = {
      churnedCustomers: 0,
      churnedMrr: 0,
      expansionMrr: 0,
      existingCash: 0,
    };
    const newPlg = { newMrr: 0, newCash: 0 };
    for (let p = 0; p < plgPlans.length; p++) {
      const plan = plgPlans[p];
      const state = plgStates[p];
      const existing =
        i === 0
          ? openingBookCash(state)
          : advanceExistingRevenue(
              state,
              i,
              plan.churnRate,
              plan.expansionRate
            );
      const planNewCustomers = Math.round(
        plan.monthlyTrials * (plan.trialConversionRate / 100)
      );
      const added = addNewRevenue(state, i, planNewCustomers, {
        avgAcv: plan.avgAcv,
        monthlyDealShare: plan.monthlyDealShare,
      });
      newPlgCustomers += planNewCustomers;
      plgExisting.churnedCustomers += existing.churnedCustomers;
      plgExisting.churnedMrr += existing.churnedMrr;
      plgExisting.expansionMrr += existing.expansionMrr;
      plgExisting.existingCash += existing.existingCash;
      newPlg.newMrr += added.newMrr;
      newPlg.newCash += added.newCash;
    }
    const newSalesCustomers = Math.round(
      revenue.sales.monthlySqls * (revenue.sales.closeRate / 100)
    );
    const newPartnerCustomers = Math.round(
      revenue.partners.monthlyReferrals * (revenue.partners.closeRate / 100)
    );

    const salesExisting =
      i === 0
        ? openingBookCash(salesState)
        : advanceExistingRevenue(
            salesState,
            i,
            revenue.sales.churnRate,
            revenue.sales.expansionRate
          );
    const partnerExisting =
      i === 0
        ? openingBookCash(partnerState)
        : advanceExistingRevenue(
            partnerState,
            i,
            assumptions.churnRate,
            0
          );

    // ── New MRR and cash from new customers ──
    // PLG prices from ACV only; deal share only affects cash timing (monthly vs annual).
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
    }
    // Existing book is already on a collection cycle — current MRR lands this month.
    pendingExistingCustomerCash[i] +=
      plgExisting.existingCash +
      salesExisting.existingCash +
      partnerExisting.existingCash;

    const plgMrr = plgStates.reduce((sum, state) => sum + totalStreamMrr(state), 0);
    const salesMrr = totalStreamMrr(salesState);
    const partnerMrr = totalStreamMrr(partnerState);
    const plgCustomers = Math.round(
      plgStates.reduce((sum, state) => sum + totalStreamCustomers(state), 0)
    );
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
    let totalFte = 0;
    let totalHeadcount = 0;
    const fteByCategory: Record<string, number> = {};
    const countByCategory: Record<string, number> = {};
    const headcountByCategory: Record<ExpenseCategory, number> = {
      cos: 0,
      gtm: 0,
      rnd: 0,
      cs: 0,
      ops: 0,
    };
    for (const person of expenses.headcount) {
      if (date < person.startMonth) continue;
      if (person.endMonth && date > person.endMonth) continue;

      const adjusted = person.baseSalary * salaryGrowth;
      const taxed = personTypeHasEmployerTax(person.type ?? "employee")
        ? adjusted * (1 + assumptions.salaryTaxRate / 100)
        : adjusted;
      const cost = taxed * person.fte;

      headcountExpense += cost;
      const cat = person.category as ExpenseCategory;
      if (EXPENSE_CATEGORIES.includes(cat)) {
        headcountByCategory[cat] += cost;
      }

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
      newSalesBookings: newSalesCustomers * (revenue.sales.avgAcv || 0),
      people: {
        totalFte,
        totalCount: totalHeadcount,
        fteByCategory,
        countByCategory,
      },
    };

    // Non-people costs (flexible cost model; fixed-amount fallback)
    let nonHeadcountExpense = 0;
    const nonHeadcountByCategory: Record<ExpenseCategory, number> = {
      cos: 0,
      gtm: 0,
      rnd: 0,
      cs: 0,
      ops: 0,
    };
    for (const expense of expenses.nonHeadcount) {
      const monthCost = resolveExpenseMonth(expense, monthContext);
      if (monthCost === 0) continue;
      nonHeadcountExpense += monthCost;
      const cat = expense.category as ExpenseCategory;
      if (EXPENSE_CATEGORIES.includes(cat)) {
        nonHeadcountByCategory[cat] += monthCost;
      }
    }

    const cosExpense = headcountByCategory.cos + nonHeadcountByCategory.cos;
    const gtmExpense = headcountByCategory.gtm + nonHeadcountByCategory.gtm;
    const rndExpense = headcountByCategory.rnd + nonHeadcountByCategory.rnd;
    const csExpense = headcountByCategory.cs + nonHeadcountByCategory.cs;
    const opsExpense = headcountByCategory.ops + nonHeadcountByCategory.ops;

    const totalExpense = headcountExpense + nonHeadcountExpense;
    const grossProfit = totalMrr - cosExpense;
    const grossMarginPct =
      totalMrr > 0 ? (grossProfit / totalMrr) * 100 : 0;
    const operatingExpenses = gtmExpense + rndExpense + csExpense + opsExpense;
    const ebit = grossProfit - operatingExpenses;
    const ebitMarginPct = totalMrr > 0 ? (ebit / totalMrr) * 100 : 0;
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
      fundraisingCashIn: round2(raiseInjection),
      headcountExpense: round2(headcountExpense),
      nonHeadcountExpense: round2(nonHeadcountExpense),
      cosExpense: round2(cosExpense),
      gtmExpense: round2(gtmExpense),
      rndExpense: round2(rndExpense),
      csExpense: round2(csExpense),
      opsExpense: round2(opsExpense),
      totalExpense: round2(totalExpense),
      grossProfit: round2(grossProfit),
      grossMarginPct: round2(grossMarginPct),
      operatingExpenses: round2(operatingExpenses),
      ebit: round2(ebit),
      ebitMarginPct: round2(ebitMarginPct),
      netBurn: round2(netBurn),
      cumulativeBurn: round2(cumulativeBurn),
      cashRemaining: round2(cashRemaining),
    });
  }

  const summary = computeSummary(months, assumptions);
  const startingRunRate = computeStartingRunRate(
    startMonth,
    revenue,
    expenses,
    assumptions
  );
  return { months, summary, startingRunRate };
}

// ============================================================================
// Summary Metrics
// ============================================================================

function emptyExpenseByCategory(): Record<ExpenseCategory, number> {
  return { cos: 0, gtm: 0, rnd: 0, cs: 0, ops: 0 };
}

function emptyForecastSummary(assumptions: AssumptionsInput): ForecastSummary {
  return {
    projectedArr: 0,
    projectedMrr: 0,
    annualNrr: 100,
    annualGrr: 100,
    cac: 0,
    cacPaybackMonths: 0,
    ltv: 0,
    ltvCacRatio: 0,
    monthlyBurn: 0,
    burnMultiple: 0,
    netNewArr: 0,
    totalCustomers: 0,
    ruleOf40: 0,
    cashOnHand: assumptions.cashOnHand,
    runwayMonths: assumptions.cashOnHand > 0 ? 999 : 0,
    mrrGrowthRate: 0,
    arrGrowthRate: 0,
    arpa: 0,
    quickRatio: 0,
    salesEfficiency: 0,
    magicNumber: null,
    rndPctOfRevenue: 0,
    netNewArrMix: { newPct: 0, expansionPct: 0, churnPct: 0 },
    totalNewMrr: 0,
    totalExpansionMrr: 0,
    totalChurnedMrr: 0,
    grossProfit: 0,
    grossMarginPct: 0,
    ebit: 0,
    ebitMarginPct: 0,
    operatingExpenses: 0,
    expenseByCategory: emptyExpenseByCategory(),
  };
}

function netPlannedRaise(assumptions: AssumptionsInput): number {
  const amount = assumptions.plannedRaiseAmount;
  if (amount == null || amount <= 0) return 0;
  return amount * (1 - assumptions.fundraisingFees / 100);
}

/**
 * Current run-rate at plan start: opening book + in-place costs only.
 * Ignores new-business funnel and later hires. Runway months exclude the
 * planned raise; raiseBridgesUntilMonth is set when that raise arrives
 * before cash would hit zero at this burn.
 */
export function computeStartingRunRate(
  startMonth: string,
  revenue: RevenueConfig,
  expenses: ExpenseInput,
  assumptions: AssumptionsInput
): StartingRunRate {
  const plgPlans = getPlgPlans(revenue);
  const plgMrr = plgPlans.reduce(
    (sum, plan) => sum + openingAmount(plan.startingMrr),
    0
  );
  const salesMrr = openingAmount(revenue.sales.startingMrr);
  const partnerMrr = openingAmount(revenue.partners.startingMrr);
  const currentMrr = plgMrr + salesMrr + partnerMrr;

  const plgCustomers = plgPlans.reduce(
    (sum, plan) => sum + openingAmount(plan.startingCustomers),
    0
  );
  const salesCustomers = openingAmount(revenue.sales.startingCustomers);
  const partnerCustomers = openingAmount(revenue.partners.startingCustomers);
  const currentCustomers = Math.round(
    plgCustomers + salesCustomers + partnerCustomers
  );

  let headcountExpense = 0;
  let headcountCos = 0;
  let totalFte = 0;
  let totalHeadcount = 0;
  const fteByCategory: Record<string, number> = {};
  const countByCategory: Record<string, number> = {};

  for (const person of expenses.headcount) {
    if (startMonth < person.startMonth) continue;
    if (person.endMonth && startMonth > person.endMonth) continue;

    const taxed = personTypeHasEmployerTax(person.type ?? "employee")
      ? person.baseSalary * (1 + assumptions.salaryTaxRate / 100)
      : person.baseSalary;
    const cost = taxed * person.fte;
    headcountExpense += cost;
    if (person.category === "cos") headcountCos += cost;
    totalFte += person.fte;
    totalHeadcount += 1;
    fteByCategory[person.category] =
      (fteByCategory[person.category] ?? 0) + person.fte;
    countByCategory[person.category] =
      (countByCategory[person.category] ?? 0) + 1;
  }

  const monthContext: MonthContext = {
    date: startMonth,
    monthIndex: 0,
    inflationGrowth: 1,
    mrr: {
      total: currentMrr,
      plg: plgMrr,
      sales: salesMrr,
      partners: partnerMrr,
    },
    activeCustomers: {
      total: currentCustomers,
      plg: Math.round(plgCustomers),
      sales: Math.round(salesCustomers),
      partners: Math.round(partnerCustomers),
    },
    newCustomers: { total: 0, plg: 0, sales: 0, partners: 0 },
    newSalesBookings: 0,
    people: {
      totalFte,
      totalCount: totalHeadcount,
      fteByCategory,
      countByCategory,
    },
  };

  let nonHeadcountExpense = 0;
  let nonHeadcountCos = 0;
  for (const expense of expenses.nonHeadcount) {
    const monthCost = resolveExpenseMonth(expense, monthContext);
    if (monthCost === 0) continue;
    nonHeadcountExpense += monthCost;
    if (expense.category === "cos") nonHeadcountCos += monthCost;
  }

  const currentCos = headcountCos + nonHeadcountCos;
  const currentCosts = headcountExpense + nonHeadcountExpense;
  const currentOpex = currentCosts - currentCos;
  const netBurn = currentCosts - currentMrr;
  const cashOnHand = assumptions.cashOnHand;
  const runwayMonths =
    netBurn <= 0 ? (cashOnHand > 0 || currentMrr > 0 ? 999 : 0) : cashOnHand / netBurn;

  const netRaise = netPlannedRaise(assumptions);
  const plannedRaiseMonth =
    assumptions.plannedRaiseMonth &&
    netRaise > 0 &&
    assumptions.plannedRaiseMonth >= startMonth
      ? assumptions.plannedRaiseMonth
      : null;

  let raiseBridgesUntilMonth: string | null = null;
  if (plannedRaiseMonth && netBurn > 0) {
    const monthsUntilRaise = monthDiff(startMonth, plannedRaiseMonth);
    // Still have cash at the start of the raise month (did not hit zero earlier).
    // A raise in the start month always arrives in time.
    if (monthsUntilRaise === 0 || cashOnHand > netBurn * monthsUntilRaise) {
      raiseBridgesUntilMonth = plannedRaiseMonth;
    }
  }

  return {
    date: startMonth,
    currentMrr: round2(currentMrr),
    currentCustomers,
    currentCos: round2(currentCos),
    currentOpex: round2(currentOpex),
    currentCosts: round2(currentCosts),
    netBurn: round2(netBurn),
    cashOnHand: round2(cashOnHand),
    runwayMonths: round2(runwayMonths),
    plannedRaiseMonth,
    raiseBridgesUntilMonth,
  };
}

export function computeSummary(
  months: ForecastMonth[],
  assumptions: AssumptionsInput
): ForecastSummary {
  if (months.length === 0) {
    return emptyForecastSummary(assumptions);
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

  // Average MRR per customer (ARPA)
  const arpa =
    last.totalCustomers > 0
      ? last.totalMrr / last.totalCustomers
      : assumptions.baseAcv / 12;

  // CAC payback in months
  const cacPayback = arpa > 0 ? cac / arpa : 0;

  // LTV = ARPA / monthly churn, then LTV / CAC
  const ltv =
    monthlyChurn > 0 ? arpa / monthlyChurn : arpa * 60;
  const ltvCac = cac > 0 ? ltv / cac : 0;

  // Monthly burn (last month)
  const monthlyBurn = last.netBurn;

  // Net new ARR over forecast period
  const netNewArr = last.totalArr - first.totalArr;

  // Burn Multiple = |annual burn| / net new ARR
  const annualBurn = Math.abs(monthlyBurn) * 12;
  const burnMultiple = netNewArr > 0 ? annualBurn / netNewArr : 0;

  // MRR growth rate over the selected period
  const mrrGrowthRate =
    months.length > 1 && first.totalMrr > 0
      ? ((last.totalMrr - first.totalMrr) / first.totalMrr) * 100
      : last.totalMrr > 0
        ? 100
        : 0;

  // Annualized ARR growth rate
  const arrGrowthRate =
    months.length >= 12 && months[0].totalMrr > 0
      ? ((months[11].totalMrr - months[0].totalMrr) / months[0].totalMrr) * 100
      : months.length > 1 && first.totalMrr > 0
        ? (Math.pow(last.totalMrr / first.totalMrr, 12 / months.length) - 1) *
          100
        : 0;

  // Rule of 40: MRR growth % + EBIT margin %
  const ebitMargin =
    last.totalMrr > 0 ? (last.ebit / last.totalMrr) * 100 : -100;
  const ruleOf40 = mrrGrowthRate + ebitMargin;

  // Period MRR movement totals for mix and quick ratio
  const totalNewMrr = months.reduce((sum, m) => sum + m.newMrr, 0);
  const totalExpansionMrr = months.reduce((sum, m) => sum + m.expansionMrr, 0);
  const totalChurnedMrr = months.reduce((sum, m) => sum + m.churnedMrr, 0);
  const mixDenominator = totalNewMrr + totalExpansionMrr + totalChurnedMrr;
  const netNewArrMix: NetNewArrMix =
    mixDenominator > 0
      ? {
          newPct: (totalNewMrr / mixDenominator) * 100,
          expansionPct: (totalExpansionMrr / mixDenominator) * 100,
          churnPct: (totalChurnedMrr / mixDenominator) * 100,
        }
      : { newPct: 0, expansionPct: 0, churnPct: 0 };

  const quickRatio =
    totalChurnedMrr > 0
      ? (totalNewMrr + totalExpansionMrr) / totalChurnedMrr
      : totalNewMrr + totalExpansionMrr > 0
        ? 999
        : 0;

  // Sales efficiency: GTM spend / net new ARR (over period)
  const salesEfficiency =
    netNewArr > 0 ? totalGtmSpend / netNewArr : 0;

  // Magic number: net new ARR in last quarter / GTM spend in prior quarter
  let magicNumber: number | null = null;
  if (months.length >= 6) {
    const q2StartIdx = Math.max(0, months.length - 3);
    const q1EndIdx = q2StartIdx;
    const q1StartIdx = Math.max(0, q1EndIdx - 3);
    const q2StartArr =
      q2StartIdx > 0 ? months[q2StartIdx - 1].totalArr : months[0].totalArr;
    const q2NetNewArr = last.totalArr - q2StartArr;
    const q1GtmSpend = months
      .slice(q1StartIdx, q1EndIdx)
      .reduce((sum, m) => sum + m.gtmExpense, 0);
    if (q1GtmSpend > 0) {
      magicNumber = q2NetNewArr / q1GtmSpend;
    }
  }

  const rndPctOfRevenue =
    last.totalMrr > 0 ? (last.rndExpense / last.totalMrr) * 100 : 0;

  const expenseByCategory: Record<ExpenseCategory, number> = {
    cos: last.cosExpense,
    gtm: last.gtmExpense,
    rnd: last.rndExpense,
    cs: last.csExpense,
    ops: last.opsExpense,
  };

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
    ltv: round2(ltv),
    ltvCacRatio: round2(ltvCac),
    monthlyBurn: round2(monthlyBurn),
    burnMultiple: round2(Math.abs(burnMultiple)),
    netNewArr: round2(netNewArr),
    totalCustomers: last.totalCustomers,
    ruleOf40: round2(ruleOf40),
    cashOnHand: assumptions.cashOnHand,
    runwayMonths: round2(runwayMonths === Infinity ? 999 : runwayMonths),
    mrrGrowthRate: round2(mrrGrowthRate),
    arrGrowthRate: round2(arrGrowthRate),
    arpa: round2(arpa),
    quickRatio: round2(quickRatio === 999 ? 999 : quickRatio),
    salesEfficiency: round2(salesEfficiency),
    magicNumber: magicNumber !== null ? round2(magicNumber) : null,
    rndPctOfRevenue: round2(rndPctOfRevenue),
    netNewArrMix: {
      newPct: round2(netNewArrMix.newPct),
      expansionPct: round2(netNewArrMix.expansionPct),
      churnPct: round2(netNewArrMix.churnPct),
    },
    totalNewMrr: round2(totalNewMrr),
    totalExpansionMrr: round2(totalExpansionMrr),
    totalChurnedMrr: round2(totalChurnedMrr),
    grossProfit: round2(last.grossProfit),
    grossMarginPct: round2(last.grossMarginPct),
    ebit: round2(last.ebit),
    ebitMarginPct: round2(last.ebitMarginPct),
    operatingExpenses: round2(last.operatingExpenses),
    expenseByCategory: {
      cos: round2(expenseByCategory.cos),
      gtm: round2(expenseByCategory.gtm),
      rnd: round2(expenseByCategory.rnd),
      cs: round2(expenseByCategory.cs),
      ops: round2(expenseByCategory.ops),
    },
  };
}
