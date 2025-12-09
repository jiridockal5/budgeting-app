import { prisma } from "./prisma";

/**
 * Monthly forecast data point
 */
export type MonthlyPoint = {
  monthIndex: number; // 0..N-1
  date: string; // 'YYYY-MM-01'
  plgMrr: number;
  salesMrr: number;
  partnerMrr: number;
  totalMrr: number;
  newPlgCustomers: number;
  newSalesCustomers: number;
  newPartnerCustomers: number;
};

/**
 * Internal state for tracking revenue streams month-over-month
 */
type PLGState = {
  monthlyTraffic: number;
  customers: number;
  mrr: number;
};

type SalesState = {
  leads: number;
  customers: number;
  mrr: number;
  // Track deals in pipeline by close month
  pipeline: Map<number, number>; // monthIndex -> number of customers closing
};

type PartnerState = {
  activePartners: number;
  customers: number;
  mrr: number;
};

/**
 * Format date as YYYY-MM-01 for a given month offset
 */
function formatMonthDate(startMonth: Date, monthOffset: number): string {
  const date = new Date(startMonth);
  date.setMonth(date.getMonth() + monthOffset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

/**
 * Calculate PLG revenue for a single month
 */
function calculatePLGMonth(
  state: PLGState,
  assumptions: {
    trafficGrowthRate: number;
    signupRate: number;
    paidConversionRate: number;
    churnRate: number;
    arpa: number;
  }
): { newCustomers: number; mrr: number } {
  // Grow traffic
  state.monthlyTraffic *= 1 + assumptions.trafficGrowthRate;

  // Calculate new signups
  const signups = state.monthlyTraffic * assumptions.signupRate;

  // Calculate new paid customers
  const newCustomers = signups * assumptions.paidConversionRate;

  // Apply churn (lose customers)
  state.customers = Math.max(0, state.customers * (1 - assumptions.churnRate));

  // Add new customers
  state.customers += newCustomers;

  // Calculate MRR
  state.mrr = state.customers * assumptions.arpa;

  return {
    newCustomers,
    mrr: state.mrr,
  };
}

/**
 * Calculate Sales revenue for a single month
 */
function calculateSalesMonth(
  state: SalesState,
  assumptions: {
    leadGrowthRate: number;
    sqlRate: number;
    winRate: number;
    salesCycleMonths: number;
    acv: number;
    churnRate: number;
    expansionRate: number;
  },
  monthIndex: number
): { newCustomers: number; mrr: number } {
  // Grow leads
  state.leads *= 1 + assumptions.leadGrowthRate;

  // Convert leads to SQLs
  const sqls = state.leads * assumptions.sqlRate;

  // SQLs convert to wins, but they close after salesCycleMonths
  const closeMonthIndex = monthIndex + assumptions.salesCycleMonths;
  const newWins = sqls * assumptions.winRate;

  // Add wins to pipeline for future close
  const currentCloseCount = state.pipeline.get(closeMonthIndex) || 0;
  state.pipeline.set(closeMonthIndex, currentCloseCount + newWins);

  // Check if any deals close this month
  const closingThisMonth = state.pipeline.get(monthIndex) || 0;

  // Apply churn (lose customers and proportional MRR)
  state.customers = Math.max(0, state.customers * (1 - assumptions.churnRate));
  state.mrr = state.mrr * (1 - assumptions.churnRate);

  // Apply expansion (existing customers expand their MRR)
  state.mrr = state.mrr * (1 + assumptions.expansionRate);

  // Add new customers that closed this month
  state.customers += closingThisMonth;

  // Calculate new MRR from new customers (ACV converted to monthly)
  const newMrrFromNewCustomers = closingThisMonth * (assumptions.acv / 12);

  // Add MRR from new customers
  state.mrr += newMrrFromNewCustomers;

  return {
    newCustomers: closingThisMonth,
    mrr: state.mrr,
  };
}

/**
 * Calculate Partner revenue for a single month
 */
function calculatePartnerMonth(
  state: PartnerState,
  assumptions: {
    partnerGrowthRate: number;
    leadsPerPartner: number;
    conversionRate: number;
    arpa: number;
    revenueShare: number;
    churnRate: number;
  }
): { newCustomers: number; mrr: number } {
  // Grow active partners
  state.activePartners *= 1 + assumptions.partnerGrowthRate;

  // Calculate leads from partners
  const totalLeads = state.activePartners * assumptions.leadsPerPartner;

  // Convert leads to customers
  const newCustomers = totalLeads * assumptions.conversionRate;

  // Apply churn (lose customers)
  state.customers = Math.max(0, state.customers * (1 - assumptions.churnRate));

  // Add new customers
  state.customers += newCustomers;

  // Calculate gross MRR (before revenue share)
  const grossMrr = state.customers * assumptions.arpa;

  // Net MRR after revenue share (we keep 1 - revenueShare)
  state.mrr = grossMrr * (1 - assumptions.revenueShare);

  return {
    newCustomers,
    mrr: state.mrr,
  };
}

/**
 * Build revenue forecast for a scenario
 *
 * @param scenarioId - ID of the ForecastScenario
 * @returns Array of monthly forecast points
 */
export async function buildRevenueForecast(
  scenarioId: string
): Promise<MonthlyPoint[]> {
  // Fetch scenario and all assumptions
  const scenario = await prisma.forecastScenario.findUnique({
    where: { id: scenarioId },
    include: {
      plgAssumptions: true,
      salesAssumptions: true,
      partnerAssumptions: true,
    },
  });

  if (!scenario) {
    throw new Error(`ForecastScenario with id ${scenarioId} not found`);
  }

  const results: MonthlyPoint[] = [];

  // Initialize states
  const plgState: PLGState = {
    monthlyTraffic: scenario.plgAssumptions
      ? Number(scenario.plgAssumptions.monthlyTraffic)
      : 0,
    customers: 0,
    mrr: 0,
  };

  const salesState: SalesState = {
    leads: scenario.salesAssumptions
      ? Number(scenario.salesAssumptions.monthlyLeads)
      : 0,
    customers: 0,
    mrr: 0,
    pipeline: new Map(),
  };

  const partnerState: PartnerState = {
    activePartners: scenario.partnerAssumptions
      ? Number(scenario.partnerAssumptions.activePartners)
      : 0,
    customers: 0,
    mrr: 0,
  };

  // Calculate month by month
  for (let monthIndex = 0; monthIndex < scenario.months; monthIndex++) {
    let plgMrr = 0;
    let salesMrr = 0;
    let partnerMrr = 0;
    let newPlgCustomers = 0;
    let newSalesCustomers = 0;
    let newPartnerCustomers = 0;

    // PLG calculation
    if (scenario.plgAssumptions) {
      const plgResult = calculatePLGMonth(plgState, {
        trafficGrowthRate: Number(scenario.plgAssumptions.trafficGrowthRate),
        signupRate: Number(scenario.plgAssumptions.signupRate),
        paidConversionRate: Number(
          scenario.plgAssumptions.paidConversionRate
        ),
        churnRate: Number(scenario.plgAssumptions.churnRate),
        arpa: Number(scenario.plgAssumptions.arpa),
      });
      plgMrr = plgResult.mrr;
      newPlgCustomers = plgResult.newCustomers;
    }

    // Sales calculation
    if (scenario.salesAssumptions) {
      const salesResult = calculateSalesMonth(
        salesState,
        {
          leadGrowthRate: Number(scenario.salesAssumptions.leadGrowthRate),
          sqlRate: Number(scenario.salesAssumptions.sqlRate),
          winRate: Number(scenario.salesAssumptions.winRate),
          salesCycleMonths: scenario.salesAssumptions.salesCycleMonths,
          acv: Number(scenario.salesAssumptions.acv),
          churnRate: Number(scenario.salesAssumptions.churnRate),
          expansionRate: Number(scenario.salesAssumptions.expansionRate),
        },
        monthIndex
      );
      salesMrr = salesResult.mrr;
      newSalesCustomers = salesResult.newCustomers;
    }

    // Partner calculation
    if (scenario.partnerAssumptions) {
      const partnerResult = calculatePartnerMonth(partnerState, {
        partnerGrowthRate: Number(
          scenario.partnerAssumptions.partnerGrowthRate
        ),
        leadsPerPartner: Number(scenario.partnerAssumptions.leadsPerPartner),
        conversionRate: Number(scenario.partnerAssumptions.conversionRate),
        arpa: Number(scenario.partnerAssumptions.arpa),
        revenueShare: Number(scenario.partnerAssumptions.revenueShare),
        churnRate: Number(scenario.partnerAssumptions.churnRate),
      });
      partnerMrr = partnerResult.mrr;
      newPartnerCustomers = partnerResult.newCustomers;
    }

    // Create monthly point
    results.push({
      monthIndex,
      date: formatMonthDate(scenario.startMonth, monthIndex),
      plgMrr,
      salesMrr,
      partnerMrr,
      totalMrr: plgMrr + salesMrr + partnerMrr,
      newPlgCustomers,
      newSalesCustomers,
      newPartnerCustomers,
    });
  }

  return results;
}