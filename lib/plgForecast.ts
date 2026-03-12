/**
 * PLG Advanced Forecasting Utilities
 *
 * Pure functions for resolving monthly metric arrays from rule-based inputs,
 * metric metadata for the UI, seasonality presets, and config converters.
 */

import type {
  PlgConfig,
  PlgAdvancedConfig,
  PlgMetricKey,
  PlgMetricRow,
} from "./revenueForecast";
import { PLG_METRIC_KEYS } from "./revenueForecast";

// ============================================================================
// Metric Metadata
// ============================================================================

export interface PlgMetricMeta {
  key: PlgMetricKey;
  label: string;
  shortLabel: string;
  helper: string;
  tooltip: string;
  suffix?: string;
  prefix?: string;
  decimals: number;
  defaultValue: number;
}

export const PLG_METRIC_META: Record<PlgMetricKey, PlgMetricMeta> = {
  visitors: {
    key: "visitors",
    label: "Visitors",
    shortLabel: "Visitors",
    helper: "Monthly website visitors entering your PLG funnel",
    tooltip:
      "Total unique visitors to your website or product page each month. This is the top of your self-service funnel.",
    decimals: 0,
    defaultValue: 5000,
  },
  visitorToTrialPct: {
    key: "visitorToTrialPct",
    label: "Visitor \u2192 trial %",
    shortLabel: "Visitor\u2192Trial",
    helper: "Share of visitors who sign up for a free trial",
    tooltip:
      "The percentage of website visitors who create a trial account. Typically 2\u201310% for PLG SaaS.",
    suffix: "%",
    decimals: 1,
    defaultValue: 4,
  },
  trialToActivationPct: {
    key: "trialToActivationPct",
    label: "Trial \u2192 activation %",
    shortLabel: "Trial\u2192Active",
    helper: "Share of trials who reach your activation milestone",
    tooltip:
      "The percentage of trial users who complete your key activation step (e.g. invite a teammate, create a project). Typically 20\u201360%.",
    suffix: "%",
    decimals: 1,
    defaultValue: 50,
  },
  activationToPaidPct: {
    key: "activationToPaidPct",
    label: "Activation \u2192 paid %",
    shortLabel: "Active\u2192Paid",
    helper: "Share of activated users who become paying customers",
    tooltip:
      "The percentage of activated users who convert to a paid plan. Typically 10\u201340% for freemium/trial models.",
    suffix: "%",
    decimals: 1,
    defaultValue: 25,
  },
  arpa: {
    key: "arpa",
    label: "ARPA (\u20ac/mo)",
    shortLabel: "ARPA",
    helper: "Average revenue per account, per month",
    tooltip:
      "Average monthly revenue per paying customer. This is your ACV divided by 12.",
    prefix: "\u20ac",
    decimals: 0,
    defaultValue: 1000,
  },
  churnPct: {
    key: "churnPct",
    label: "Churn %",
    shortLabel: "Churn",
    helper: "Percentage of paying customers lost each month",
    tooltip:
      "Monthly gross customer churn rate. 2\u20135% monthly is typical for SMB SaaS; <1% for enterprise.",
    suffix: "%",
    decimals: 1,
    defaultValue: 3,
  },
  expansionPct: {
    key: "expansionPct",
    label: "Expansion %",
    shortLabel: "Expansion",
    helper: "Monthly revenue growth from existing customers",
    tooltip:
      "Monthly net expansion rate from upsells, seat additions, and plan upgrades on surviving customers.",
    suffix: "%",
    decimals: 1,
    defaultValue: 5,
  },
};

// ============================================================================
// Seasonality Presets
// ============================================================================

export interface SeasonalityPreset {
  key: string;
  label: string;
  description: string;
  multipliers: number[];
}

export const SEASONALITY_PRESETS: SeasonalityPreset[] = [
  {
    key: "none",
    label: "None",
    description: "No seasonal variation",
    multipliers: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  },
  {
    key: "saas",
    label: "SaaS / B2B",
    description: "Slower in summer and December, stronger Q1 & Q4",
    multipliers: [1.1, 1.05, 1.1, 1.0, 0.95, 0.85, 0.8, 0.85, 1.0, 1.05, 1.1, 0.95],
  },
  {
    key: "ecommerce",
    label: "E-commerce",
    description: "Strong Q4, slower Q1",
    multipliers: [0.85, 0.8, 0.9, 0.95, 1.0, 1.0, 0.9, 0.95, 1.0, 1.1, 1.2, 1.35],
  },
  {
    key: "flat",
    label: "Flat",
    description: "Equal weight every month",
    multipliers: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  },
];

// ============================================================================
// Resolution Logic
// ============================================================================

/**
 * Resolve a PlgMetricRow into a concrete array of monthly values.
 *
 * Order of operations:
 * 1. Fill with defaultValue
 * 2. Apply MoM growth compounding from growthStartMonth
 * 3. Apply seasonality multipliers (12-element pattern, wrapping)
 * 4. Apply manual overrides (take precedence over everything)
 */
export function resolveMonthlyValues(
  row: PlgMetricRow,
  numMonths: number
): number[] {
  const values = new Array<number>(numMonths);

  for (let i = 0; i < numMonths; i++) {
    let v = row.defaultValue;

    if (row.growthPct !== null && i >= row.growthStartMonth) {
      const periods = i - row.growthStartMonth;
      v *= Math.pow(1 + row.growthPct / 100, periods);
    }

    if (row.seasonality !== null && row.seasonality.length === 12) {
      v *= row.seasonality[i % 12];
    }

    values[i] = v;
  }

  for (const [idxStr, override] of Object.entries(row.overrides)) {
    const idx = Number(idxStr);
    if (idx >= 0 && idx < numMonths) {
      values[idx] = override;
    }
  }

  return values;
}

/**
 * Resolve all PLG advanced metrics into per-month arrays.
 */
export function resolveAllPlgMetrics(
  config: PlgAdvancedConfig,
  numMonths: number
): Record<PlgMetricKey, number[]> {
  const result = {} as Record<PlgMetricKey, number[]>;
  for (const key of PLG_METRIC_KEYS) {
    result[key] = resolveMonthlyValues(config.metrics[key], numMonths);
  }
  return result;
}

// ============================================================================
// Funnel Computations (client-side preview)
// ============================================================================

export interface PlgMonthlyPreview {
  visitors: number;
  trials: number;
  activated: number;
  newCustomers: number;
  arpa: number;
  churnPct: number;
  expansionPct: number;
  newMrr: number;
}

export function computePlgFunnelPreview(
  resolved: Record<PlgMetricKey, number[]>,
  numMonths: number
): PlgMonthlyPreview[] {
  const result: PlgMonthlyPreview[] = [];
  for (let i = 0; i < numMonths; i++) {
    const visitors = resolved.visitors[i];
    const trials = visitors * (resolved.visitorToTrialPct[i] / 100);
    const activated = trials * (resolved.trialToActivationPct[i] / 100);
    const newCustomers = activated * (resolved.activationToPaidPct[i] / 100);
    const arpa = resolved.arpa[i];
    const churnPct = resolved.churnPct[i];
    const expansionPct = resolved.expansionPct[i];
    const newMrr = newCustomers * arpa;
    result.push({
      visitors,
      trials,
      activated,
      newCustomers,
      arpa,
      churnPct,
      expansionPct,
      newMrr,
    });
  }
  return result;
}

export interface PlgSummaryStats {
  totalNewCustomers: number;
  month24Customers: number;
  month24Mrr: number;
  month24Arr: number;
  avgFullFunnelConversion: number;
  avgChurn: number;
}

export function computePlgSummary(
  resolved: Record<PlgMetricKey, number[]>,
  numMonths: number
): PlgSummaryStats {
  const preview = computePlgFunnelPreview(resolved, numMonths);

  let totalNewCustomers = 0;
  let customers = 0;
  let mrr = 0;
  let sumConversion = 0;
  let sumChurn = 0;

  for (let i = 0; i < numMonths; i++) {
    const p = preview[i];
    const churned = customers > 0 ? customers * (p.churnPct / 100) : 0;
    const expansion = mrr * (p.expansionPct / 100);
    const churnMrr = mrr * (p.churnPct / 100);

    customers = Math.max(0, customers + p.newCustomers - churned);
    mrr = Math.max(0, mrr - churnMrr + expansion + p.newMrr);
    totalNewCustomers += p.newCustomers;

    const funnelConversion =
      p.visitors > 0 ? (p.newCustomers / p.visitors) * 100 : 0;
    sumConversion += funnelConversion;
    sumChurn += p.churnPct;
  }

  return {
    totalNewCustomers: Math.round(totalNewCustomers),
    month24Customers: Math.round(customers),
    month24Mrr: Math.round(mrr),
    month24Arr: Math.round(mrr * 12),
    avgFullFunnelConversion: numMonths > 0 ? sumConversion / numMonths : 0,
    avgChurn: numMonths > 0 ? sumChurn / numMonths : 0,
  };
}

// ============================================================================
// Config Conversion
// ============================================================================

function makeRow(defaultValue: number): PlgMetricRow {
  return {
    defaultValue,
    growthPct: null,
    growthStartMonth: 0,
    seasonality: null,
    overrides: {},
  };
}

/**
 * Convert a simple PlgConfig into an advanced config,
 * mapping the old flat fields into the new 7-metric structure.
 */
export function buildPlgAdvancedConfigFromSimple(
  simple: PlgConfig
): PlgAdvancedConfig {
  const trials = simple.monthlyTrials;
  const convRate = simple.trialConversionRate / 100;
  const visitors = convRate > 0 ? Math.round(trials / convRate / 0.5) : 10000;
  const visitorToTrialPct =
    visitors > 0 ? (trials / visitors) * 100 : 4;

  return {
    mode: "advanced",
    metrics: {
      visitors: makeRow(visitors),
      visitorToTrialPct: makeRow(Math.round(visitorToTrialPct * 10) / 10),
      trialToActivationPct: makeRow(50),
      activationToPaidPct: makeRow(
        convRate > 0 ? Math.round((convRate / 0.5) * 100 * 10) / 10 : 25
      ),
      arpa: makeRow(Math.round(simple.avgAcv / 12)),
      churnPct: makeRow(simple.churnRate),
      expansionPct: makeRow(simple.expansionRate),
    },
  };
}

/**
 * Convert an advanced config back to a simple PlgConfig
 * by taking the defaultValues.
 */
export function buildPlgSimpleConfigFromAdvanced(
  advanced: PlgAdvancedConfig
): PlgConfig {
  const m = advanced.metrics;
  const visitors = m.visitors.defaultValue;
  const trialPct = m.visitorToTrialPct.defaultValue / 100;
  const activationPct = m.trialToActivationPct.defaultValue / 100;
  const paidPct = m.activationToPaidPct.defaultValue / 100;
  const trials = visitors * trialPct;
  const fullConversion = trialPct * activationPct * paidPct;
  const overallConversionRate = fullConversion > 0 ? (activationPct * paidPct) * 100 : 8;

  return {
    monthlyTrials: Math.round(trials),
    trialConversionRate: Math.round(overallConversionRate * 10) / 10,
    avgAcv: m.arpa.defaultValue * 12,
    churnRate: m.churnPct.defaultValue,
    expansionRate: m.expansionPct.defaultValue,
  };
}

/**
 * Create a default PlgAdvancedConfig from scratch.
 */
export function createDefaultAdvancedConfig(): PlgAdvancedConfig {
  return {
    mode: "advanced",
    metrics: {
      visitors: makeRow(PLG_METRIC_META.visitors.defaultValue),
      visitorToTrialPct: makeRow(PLG_METRIC_META.visitorToTrialPct.defaultValue),
      trialToActivationPct: makeRow(PLG_METRIC_META.trialToActivationPct.defaultValue),
      activationToPaidPct: makeRow(PLG_METRIC_META.activationToPaidPct.defaultValue),
      arpa: makeRow(PLG_METRIC_META.arpa.defaultValue),
      churnPct: makeRow(PLG_METRIC_META.churnPct.defaultValue),
      expansionPct: makeRow(PLG_METRIC_META.expansionPct.defaultValue),
    },
  };
}
