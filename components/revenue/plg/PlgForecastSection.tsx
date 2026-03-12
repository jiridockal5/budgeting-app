"use client";

import { useState, useCallback } from "react";
import { Sparkles, TrendingUp, Zap, LayoutGrid } from "lucide-react";
import type {
  PlgConfig,
  PlgAdvancedConfig,
  PlgMetricKey,
  PlgMetricRow,
} from "@/lib/revenueForecast";
import { isPlgAdvanced } from "@/lib/revenueForecast";
import {
  buildPlgAdvancedConfigFromSimple,
  buildPlgSimpleConfigFromAdvanced,
  createDefaultAdvancedConfig,
} from "@/lib/plgForecast";
import { formatCurrency, formatPercentage } from "@/lib/assumptions";
import { PlgAdvancedGrid } from "./PlgAdvancedGrid";
import { PlgLiveSummary } from "./PlgLiveSummary";
import { PlgOnboardingHint } from "./PlgOnboardingHint";

// ============================================================================
// Simple form (extracted from the old PlgStreamForm)
// ============================================================================

function StreamInputField({
  label,
  value,
  onChange,
  helper,
  prefix,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
  helper: string;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          step="any"
          min="0"
          className={`
            w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm text-slate-900
            shadow-sm transition placeholder:text-slate-400
            focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100
            ${prefix ? "pl-8" : "pl-3"}
            ${suffix ? "pr-10" : "pr-3"}
          `}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
            {suffix}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{helper}</p>
    </div>
  );
}

function PlgSimpleForm({
  config,
  setConfig,
  newCustomers,
}: {
  config: PlgConfig;
  setConfig: (updater: PlgConfig | ((prev: PlgConfig) => PlgConfig)) => void;
  newCustomers: number;
}) {
  const updateField = (field: keyof PlgConfig, value: string) => {
    const numValue = parseFloat(value) || 0;
    setConfig((prev) => ({ ...prev, [field]: numValue }));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <StreamInputField
          label="Monthly new trials"
          value={config.monthlyTrials}
          onChange={(v) => updateField("monthlyTrials", v)}
          helper="Number of new trial signups per month"
        />
        <StreamInputField
          label="Trial \u2192 paid conversion"
          value={config.trialConversionRate}
          onChange={(v) => updateField("trialConversionRate", v)}
          helper="Percentage of trials that convert to paid"
          suffix="%"
        />
        <StreamInputField
          label="Average self-service ACV"
          value={config.avgAcv}
          onChange={(v) => updateField("avgAcv", v)}
          helper="Annual contract value for self-service customers"
          prefix="\u20ac"
        />
        <StreamInputField
          label="PLG churn rate"
          value={config.churnRate}
          onChange={(v) => updateField("churnRate", v)}
          helper="Monthly churn rate for PLG customers"
          suffix="%"
        />
        <StreamInputField
          label="PLG expansion rate"
          value={config.expansionRate}
          onChange={(v) => updateField("expansionRate", v)}
          helper="Monthly expansion on surviving PLG customers"
          suffix="%"
        />
      </div>

      <div className="flex items-center gap-3 p-4 rounded-xl border bg-emerald-50 border-emerald-100">
        <div className="flex-shrink-0">
          <TrendingUp className="h-4 w-4 text-emerald-600" />
        </div>
        <p className="text-sm text-slate-700">
          <span className="font-medium text-slate-500">Preview: </span>
          <span className="font-semibold text-emerald-700">{newCustomers}</span>{" "}
          new customers / month at{" "}
          <span className="font-semibold text-emerald-700">
            {formatCurrency(config.avgAcv)}
          </span>{" "}
          ACV
          <span className="text-slate-500">
            {" "}
            (using {formatPercentage(config.churnRate)} churn,{" "}
            {formatPercentage(config.expansionRate)} expansion)
          </span>
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// PlgForecastSection
// ============================================================================

interface PlgForecastSectionProps {
  config: PlgConfig | PlgAdvancedConfig;
  setConfig: (
    updater:
      | (PlgConfig | PlgAdvancedConfig)
      | ((prev: PlgConfig | PlgAdvancedConfig) => PlgConfig | PlgAdvancedConfig)
  ) => void;
  startMonth: string;
  numMonths: number;
}

export function PlgForecastSection({
  config,
  setConfig,
  startMonth,
  numMonths,
}: PlgForecastSectionProps) {
  const isAdvanced = isPlgAdvanced(config);
  const [showConfirmSimple, setShowConfirmSimple] = useState(false);

  const switchToAdvanced = useCallback(() => {
    if (isAdvanced) return;
    const simple = config as PlgConfig;
    setConfig(buildPlgAdvancedConfigFromSimple(simple));
  }, [config, isAdvanced, setConfig]);

  const switchToSimple = useCallback(() => {
    if (!isAdvanced) return;
    const advanced = config as PlgAdvancedConfig;
    setConfig(buildPlgSimpleConfigFromAdvanced(advanced));
    setShowConfirmSimple(false);
  }, [config, isAdvanced, setConfig]);

  const handleSimpleUpdate = useCallback(
    (updater: PlgConfig | ((prev: PlgConfig) => PlgConfig)) => {
      setConfig((prev) => {
        const simple = prev as PlgConfig;
        return typeof updater === "function" ? updater(simple) : updater;
      });
    },
    [setConfig]
  );

  const handleAdvancedUpdate = useCallback(
    (
      key: PlgMetricKey,
      updater: PlgMetricRow | ((prev: PlgMetricRow) => PlgMetricRow)
    ) => {
      setConfig((prev) => {
        const adv = prev as PlgAdvancedConfig;
        const oldRow = adv.metrics[key];
        const newRow = typeof updater === "function" ? updater(oldRow) : updater;
        return {
          ...adv,
          metrics: { ...adv.metrics, [key]: newRow },
        };
      });
    },
    [setConfig]
  );

  const simpleNewCustomers = !isAdvanced
    ? Math.round(
        ((config as PlgConfig).monthlyTrials *
          (config as PlgConfig).trialConversionRate) /
          100
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Stream header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
            <Sparkles className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              PLG / Self-service
            </h2>
            <p className="text-sm text-slate-500">
              {isAdvanced
                ? "Model website traffic through paid conversion over 24 months"
                : "Product-led growth through free trials and self-service signups"}
            </p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg flex-shrink-0">
          <button
            onClick={() => {
              if (isAdvanced) {
                setShowConfirmSimple(true);
              }
            }}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
              transition-all duration-200
              ${
                !isAdvanced
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }
            `}
          >
            <Zap className="h-3 w-3" />
            Simple
          </button>
          <button
            onClick={switchToAdvanced}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
              transition-all duration-200
              ${
                isAdvanced
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }
            `}
          >
            <LayoutGrid className="h-3 w-3" />
            Advanced
          </button>
        </div>
      </div>

      {/* Confirm switch to simple */}
      {showConfirmSimple && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center justify-between gap-4">
          <span>
            Switching to Simple mode will discard your per-month edits.
            Continue?
          </span>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setShowConfirmSimple(false)}
              className="px-3 py-1 rounded-lg text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={switchToSimple}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors"
            >
              Switch to Simple
            </button>
          </div>
        </div>
      )}

      {/* Simple mode */}
      {!isAdvanced && (
        <PlgSimpleForm
          config={config as PlgConfig}
          setConfig={handleSimpleUpdate}
          newCustomers={simpleNewCustomers}
        />
      )}

      {/* Advanced mode */}
      {isAdvanced && (
        <>
          <PlgOnboardingHint />

          <PlgAdvancedGrid
            config={config as PlgAdvancedConfig}
            onUpdateMetric={handleAdvancedUpdate}
            startMonth={startMonth}
            numMonths={numMonths}
          />

          <PlgLiveSummary
            config={config as PlgAdvancedConfig}
            numMonths={numMonths}
          />
        </>
      )}
    </div>
  );
}
