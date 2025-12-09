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
 * Build revenue forecast for a scenario
 *
 * @param scenarioId - ID of the ForecastScenario
 * @returns Array of monthly forecast points
 */
export async function buildRevenueForecast(
  scenarioId: string
): Promise<MonthlyPoint[]> {
  console.warn(
    "[buildRevenueForecast] Stub called – forecast engine not wired to DB yet.",
    { scenarioId }
  );

  return [];
}
