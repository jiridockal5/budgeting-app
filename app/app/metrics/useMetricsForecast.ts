"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_ASSUMPTIONS,
  normalizeAssumptions,
  type GlobalAssumptions,
} from "@/lib/assumptions";
import { parseApiError } from "@/lib/apiErrorUtils";
import {
  computeSummary,
  type AssumptionsInput,
  type ForecastMonth,
  type ForecastResult,
  type ForecastSummary,
} from "@/lib/revenueForecast";

export function useMetricsForecast() {
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [assumptions, setAssumptions] = useState<GlobalAssumptions | null>(null);
  const [totalMonths, setTotalMonths] = useState(24);
  const [periodMonths, setPeriodMonths] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadForecast() {
      try {
        setLoading(true);
        setError(null);

        const planRes = await fetch("/api/plans/current");
        const planData = await planRes.json();
        if (!planData.success)
          throw new Error(planData.error || "Failed to load plan");

        setTotalMonths(planData.data.months);

        const [forecastRes, assumptionsRes] = await Promise.all([
          fetch(`/api/forecast?planId=${planData.data.id}`),
          fetch(`/api/assumptions?planId=${planData.data.id}`),
        ]);
        const [forecastData, assumptionsData] = await Promise.all([
          forecastRes.json(),
          assumptionsRes.json(),
        ]);

        if (!forecastData.success)
          throw new Error(forecastData.error || "Failed to compute forecast");

        setForecast(forecastData.data);

        if (assumptionsData.success) {
          setAssumptions(normalizeAssumptions(assumptionsData.data));
        }
      } catch (err) {
        console.error("Failed to load metrics:", err);
        setError(parseApiError(err));
      } finally {
        setLoading(false);
      }
    }

    loadForecast();
  }, []);

  const displayMonths = useMemo((): ForecastMonth[] => {
    if (!forecast) return [];
    if (periodMonths === null) return forecast.months;
    return forecast.months.slice(0, periodMonths);
  }, [forecast, periodMonths]);

  const summary = useMemo((): ForecastSummary | null => {
    if (!forecast || displayMonths.length === 0) return forecast?.summary ?? null;
    if (periodMonths === null) return forecast.summary;
    const assumptionsInput = (assumptions ?? DEFAULT_ASSUMPTIONS) as AssumptionsInput;
    return computeSummary(displayMonths, assumptionsInput);
  }, [forecast, displayMonths, periodMonths, assumptions]);

  const last = displayMonths.length > 0 ? displayMonths[displayMonths.length - 1] : null;
  const month6 = displayMonths.length > 6 ? displayMonths[5] : null;
  const month12 = displayMonths.length > 12 ? displayMonths[11] : null;

  return {
    forecast,
    assumptions,
    totalMonths,
    periodMonths,
    setPeriodMonths,
    loading,
    error,
    displayMonths,
    summary,
    last,
    month6,
    month12,
  };
}
