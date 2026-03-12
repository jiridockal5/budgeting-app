"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Settings2,
  Sparkles,
  Users,
  Handshake,
  ArrowRight,
  TrendingUp,
  Info,
  Check,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  GlobalAssumptions,
  DEFAULT_ASSUMPTIONS,
  formatCurrency,
  formatPercentage,
  normalizeAssumptions,
} from "@/lib/assumptions";
import type { RevenueConfig } from "@/lib/revenueForecast";
import { DEFAULT_REVENUE_CONFIG, isPlgAdvanced } from "@/lib/revenueForecast";
import { Skeleton, FormSectionSkeleton } from "@/components/ui/Skeleton";
import { useAutoSave, useAutoSaveLabel } from "@/lib/useAutoSave";
import { PlgForecastSection } from "@/components/revenue/plg/PlgForecastSection";

/**
 * Revenue stream types for the tabbed interface
 */
type RevenueStream = "plg" | "sales" | "partners";

/**
 * Revenue Page
 *
 * Define how PLG, sales, and partner streams generate ARR.
 * Data is persisted to the database via /api/revenue.
 */
export default function RevenuePage() {
  const [activeStream, setActiveStream] = useState<RevenueStream>("plg");
  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assumptions, setAssumptions] =
    useState<GlobalAssumptions>(DEFAULT_ASSUMPTIONS);
  const [config, setConfig] = useState<RevenueConfig>(DEFAULT_REVENUE_CONFIG);
  const [startMonth, setStartMonth] = useState("2026-01");
  const [numMonths, setNumMonths] = useState(24);

  // ── Load plan + revenue config on mount ──
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const planRes = await fetch("/api/plans/current");
        const planData = await planRes.json();
        if (!planData.success)
          throw new Error(planData.error || "Failed to load plan");
        const id = planData.data.id;
        setPlanId(id);
        if (planData.data.startMonth) setStartMonth(planData.data.startMonth);
        if (planData.data.months) setNumMonths(planData.data.months);

        const [revenueRes, assumptionsRes] = await Promise.all([
          fetch(`/api/revenue?planId=${id}`),
          fetch(`/api/assumptions?planId=${id}`),
        ]);

        const [revenueData, assumptionsData] = await Promise.all([
          revenueRes.json(),
          assumptionsRes.json(),
        ]);

        if (revenueData.success && revenueData.data.config) {
          setConfig(revenueData.data.config as RevenueConfig);
        }
        if (assumptionsData.success) {
          setAssumptions(normalizeAssumptions(assumptionsData.data));
        }
      } catch (err) {
        console.error("Failed to load revenue data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // ── Auto-save ──
  const saveConfig = useCallback(async () => {
    if (!planId) return;
    const res = await fetch("/api/revenue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, config }),
    });
    const data = await res.json();
    if (!data.success)
      throw new Error(data.error || "Failed to save revenue config");
  }, [planId, config]);

  const autoSave = useAutoSave(config, saveConfig, {
    enabled: !loading && !!planId,
  });
  const saveLabel = useAutoSaveLabel(autoSave);

  // ── Preview calculations ──
  const salesNewCustomers = Math.round(
    (config.sales.monthlySqls * config.sales.closeRate) / 100
  );
  const partnersNewCustomers = Math.round(
    (config.partners.monthlyReferrals * config.partners.closeRate) / 100
  );

  const streamTabs: {
    key: RevenueStream;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: "plg",
      label: "PLG / Self-service",
      icon: <Sparkles className="h-4 w-4" />,
    },
    { key: "sales", label: "Sales", icon: <Users className="h-4 w-4" /> },
    {
      key: "partners",
      label: "Partners",
      icon: <Handshake className="h-4 w-4" />,
    },
  ];

  // ── Loading state ──
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-12 w-72 rounded-xl" />
          <FormSectionSkeleton />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="space-y-8">
          <PageHeader
            title="Revenue"
            subtitle="Define how your PLG, sales, and partner streams generate ARR."
            actions={
              saveLabel ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                  {autoSave.saving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  )}
                  {saveLabel}
                </span>
              ) : null
            }
          />

          {/* Error banner */}
          {(error || autoSave.error) && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
              <span>{error || autoSave.error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 font-medium"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Assumptions Snapshot Card */}
          <AssumptionsSnapshot assumptions={assumptions} />

          {/* Stream Tabs */}
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-xl w-fit">
              {streamTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveStream(tab.key)}
                  className={`
                    inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-200 ease-out
                    ${
                      activeStream === tab.key
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }
                  `}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">
                    {tab.key === "plg"
                      ? "PLG"
                      : tab.key === "sales"
                        ? "Sales"
                        : "Partners"}
                  </span>
                </button>
              ))}
            </div>

            <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${activeStream === "plg" && isPlgAdvanced(config.plg) ? "p-4 sm:p-5" : "p-6"}`}>
              {activeStream === "plg" && (
                <PlgForecastSection
                  config={config.plg}
                  setConfig={(updater) =>
                    setConfig((prev) => ({
                      ...prev,
                      plg:
                        typeof updater === "function"
                          ? updater(prev.plg)
                          : updater,
                    }))
                  }
                  startMonth={startMonth}
                  numMonths={numMonths}
                />
              )}
              {activeStream === "sales" && (
                <SalesStreamForm
                  config={config.sales}
                  setConfig={(updater) =>
                    setConfig((prev) => ({
                      ...prev,
                      sales:
                        typeof updater === "function"
                          ? updater(prev.sales)
                          : updater,
                    }))
                  }
                  newCustomers={salesNewCustomers}
                />
              )}
              {activeStream === "partners" && (
                <PartnersStreamForm
                  config={config.partners}
                  setConfig={(updater) =>
                    setConfig((prev) => ({
                      ...prev,
                      partners:
                        typeof updater === "function"
                          ? updater(prev.partners)
                          : updater,
                    }))
                  }
                  newCustomers={partnersNewCustomers}
                />
              )}
            </div>
          </div>

          {/* Info Card */}
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                <Info className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  How revenue streams work
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Each stream uses the global assumptions as defaults, but you
                  can override churn, expansion, and ACV per stream. The forecast
                  combines all streams to project your total MRR/ARR growth over
                  time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ============================================================================
// Assumptions Snapshot
// ============================================================================

function AssumptionsSnapshot({
  assumptions,
}: {
  assumptions: GlobalAssumptions;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
            <Settings2 className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Global Assumptions
            </h2>
            <p className="text-xs text-slate-500">
              These defaults apply unless a stream overrides them
            </p>
          </div>
        </div>

        <Link
          href="/app/assumptions"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          Edit global assumptions
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SnapshotMetric
            label="Default churn"
            value={formatPercentage(assumptions.churnRate) + " / mo"}
          />
          <SnapshotMetric
            label="Expansion"
            value={formatPercentage(assumptions.expansionRate) + " / mo"}
          />
          <SnapshotMetric
            label="Collection lag"
            value={`${assumptions.paymentTimingDays} days`}
          />
          <SnapshotMetric
            label="Price uplift"
            value={
              assumptions.priceUplift == null
                ? "Optional"
                : formatPercentage(assumptions.priceUplift)
            }
          />
        </div>
      </div>
    </div>
  );
}

function SnapshotMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center sm:text-left">
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

// ============================================================================
// Sales Stream Form
// ============================================================================

import type { SalesConfig, PartnersConfig } from "@/lib/revenueForecast";

interface SalesStreamFormProps {
  config: SalesConfig;
  setConfig: (
    updater: SalesConfig | ((prev: SalesConfig) => SalesConfig)
  ) => void;
  newCustomers: number;
}

function SalesStreamForm({
  config,
  setConfig,
  newCustomers,
}: SalesStreamFormProps) {
  const updateField = (field: keyof SalesConfig, value: string) => {
    const numValue = parseFloat(value) || 0;
    setConfig((prev) => ({ ...prev, [field]: numValue }));
  };

  return (
    <div className="space-y-6">
      <StreamHeader
        icon={<Users className="h-5 w-5 text-blue-600" />}
        iconBg="bg-blue-50"
        title="Sales"
        description="Direct sales through inbound leads and outbound prospecting"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <StreamInputField
          label="Monthly inbound SQLs"
          value={config.monthlySqls}
          onChange={(v) => updateField("monthlySqls", v)}
          helper="Sales-qualified leads entering the pipeline per month"
        />
        <StreamInputField
          label="Demo → closed-won"
          value={config.closeRate}
          onChange={(v) => updateField("closeRate", v)}
          helper="Percentage of demos that result in closed deals"
          suffix="%"
        />
        <StreamInputField
          label="Average sales ACV"
          value={config.avgAcv}
          onChange={(v) => updateField("avgAcv", v)}
          helper="Annual contract value for sales-led customers"
          prefix="€"
        />
        <StreamInputField
          label="Sales churn rate"
          value={config.churnRate}
          onChange={(v) => updateField("churnRate", v)}
          helper="Monthly churn rate for sales customers"
          suffix="%"
        />
        <StreamInputField
          label="Sales expansion rate"
          value={config.expansionRate}
          onChange={(v) => updateField("expansionRate", v)}
          helper="Monthly expansion on surviving sales customers"
          suffix="%"
        />
      </div>

      <StreamPreview
        icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
        color="blue"
      >
        <span className="font-semibold text-blue-700">{newCustomers}</span> new
        customers / month at{" "}
        <span className="font-semibold text-blue-700">
          {formatCurrency(config.avgAcv)}
        </span>{" "}
        ACV
        <span className="text-slate-500">
          {" "}
          (using {formatPercentage(config.churnRate)} churn,{" "}
          {formatPercentage(config.expansionRate)} expansion)
        </span>
      </StreamPreview>
    </div>
  );
}

// ============================================================================
// Partners Stream Form
// ============================================================================

interface PartnersStreamFormProps {
  config: PartnersConfig;
  setConfig: (
    updater: PartnersConfig | ((prev: PartnersConfig) => PartnersConfig)
  ) => void;
  newCustomers: number;
}

function PartnersStreamForm({
  config,
  setConfig,
  newCustomers,
}: PartnersStreamFormProps) {
  const updateField = (field: keyof PartnersConfig, value: string) => {
    const numValue = parseFloat(value) || 0;
    setConfig((prev) => ({ ...prev, [field]: numValue }));
  };

  return (
    <div className="space-y-6">
      <StreamHeader
        icon={<Handshake className="h-5 w-5 text-violet-600" />}
        iconBg="bg-violet-50"
        title="Partners"
        description="Revenue through channel partners, affiliates, and referrals"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <StreamInputField
          label="Monthly referred deals"
          value={config.monthlyReferrals}
          onChange={(v) => updateField("monthlyReferrals", v)}
          helper="Number of partner-referred opportunities per month"
        />
        <StreamInputField
          label="Close rate"
          value={config.closeRate}
          onChange={(v) => updateField("closeRate", v)}
          helper="Percentage of partner referrals that close"
          suffix="%"
        />
        <StreamInputField
          label="Average partner ACV"
          value={config.avgAcv}
          onChange={(v) => updateField("avgAcv", v)}
          helper="Annual contract value for partner-sourced customers"
          prefix="€"
        />
        <StreamInputField
          label="Commission rate"
          value={config.commissionRate}
          onChange={(v) => updateField("commissionRate", v)}
          helper="Commission paid to partners on referred revenue"
          suffix="%"
        />
      </div>

      <StreamPreview
        icon={<TrendingUp className="h-4 w-4 text-violet-600" />}
        color="violet"
      >
        <span className="font-semibold text-violet-700">{newCustomers}</span>{" "}
        new customers / month at{" "}
        <span className="font-semibold text-violet-700">
          {formatCurrency(config.avgAcv)}
        </span>{" "}
        ACV
        <span className="text-slate-500">
          {" "}
          ({formatPercentage(config.commissionRate)} partner commission)
        </span>
      </StreamPreview>
    </div>
  );
}

// ============================================================================
// Shared Stream Components
// ============================================================================

interface StreamHeaderProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
}

function StreamHeader({ icon, iconBg, title, description }: StreamHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}
      >
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

interface StreamInputFieldProps {
  label: string;
  value: number;
  onChange: (value: string) => void;
  helper: string;
  prefix?: string;
  suffix?: string;
}

function StreamInputField({
  label,
  value,
  onChange,
  helper,
  prefix,
  suffix,
}: StreamInputFieldProps) {
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

interface StreamPreviewProps {
  icon: React.ReactNode;
  color: "emerald" | "blue" | "violet";
  children: React.ReactNode;
}

function StreamPreview({ icon, color, children }: StreamPreviewProps) {
  const bgColorMap = {
    emerald: "bg-emerald-50 border-emerald-100",
    blue: "bg-blue-50 border-blue-100",
    violet: "bg-violet-50 border-violet-100",
  };

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl border ${bgColorMap[color]}`}
    >
      <div className="flex-shrink-0">{icon}</div>
      <p className="text-sm text-slate-700">
        <span className="font-medium text-slate-500">Preview: </span>
        {children}
      </p>
    </div>
  );
}
