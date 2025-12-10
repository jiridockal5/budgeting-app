"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Settings2,
  Sparkles,
  Users,
  Handshake,
  ArrowRight,
  TrendingUp,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  DEFAULT_ASSUMPTIONS,
  formatCurrency,
  formatPercentage,
} from "@/lib/assumptions";

// TODO (later):
// - Load per-plan revenue configuration from the database (Prisma).
// - Combine it with GlobalAssumptions to compute forecasted MRR/ARR.
// - Write rows to a "revenue_forecast" table or compute on the fly.
// - Add validation for form inputs (percentages 0-100, positive numbers).
// - Implement server actions for persisting stream configurations.

/**
 * Revenue stream types for the tabbed interface
 */
type RevenueStream = "plg" | "sales" | "partners";

/**
 * Stream configuration interfaces (UI-only for now)
 */
interface PlgConfig {
  monthlyTrials: number;
  trialConversionRate: number;
  avgAcv: number;
  churnRate: number;
  expansionRate: number;
}

interface SalesConfig {
  monthlySqls: number;
  closeRate: number;
  avgAcv: number;
  churnRate: number;
  expansionRate: number;
}

interface PartnersConfig {
  monthlyReferrals: number;
  closeRate: number;
  avgAcv: number;
  commissionRate: number;
}

/**
 * Revenue Page
 *
 * Define how PLG, sales, and partner streams generate ARR.
 * Uses global assumptions as defaults, allows per-stream overrides.
 */
export default function RevenuePage() {
  const [activeStream, setActiveStream] = useState<RevenueStream>("plg");

  // PLG stream configuration (local state for now)
  const [plgConfig, setPlgConfig] = useState<PlgConfig>({
    monthlyTrials: 500,
    trialConversionRate: 8,
    avgAcv: DEFAULT_ASSUMPTIONS.baseAcv,
    churnRate: DEFAULT_ASSUMPTIONS.churnRate,
    expansionRate: DEFAULT_ASSUMPTIONS.expansionRate,
  });

  // Sales stream configuration
  const [salesConfig, setSalesConfig] = useState<SalesConfig>({
    monthlySqls: 50,
    closeRate: 25,
    avgAcv: DEFAULT_ASSUMPTIONS.baseAcv,
    churnRate: DEFAULT_ASSUMPTIONS.churnRate,
    expansionRate: DEFAULT_ASSUMPTIONS.expansionRate,
  });

  // Partners stream configuration
  const [partnersConfig, setPartnersConfig] = useState<PartnersConfig>({
    monthlyReferrals: 20,
    closeRate: 40,
    avgAcv: DEFAULT_ASSUMPTIONS.baseAcv,
    commissionRate: 20,
  });

  // Calculate preview values (simple placeholder math)
  const plgNewCustomers = Math.round(
    (plgConfig.monthlyTrials * plgConfig.trialConversionRate) / 100
  );
  const salesNewCustomers = Math.round(
    (salesConfig.monthlySqls * salesConfig.closeRate) / 100
  );
  const partnersNewCustomers = Math.round(
    (partnersConfig.monthlyReferrals * partnersConfig.closeRate) / 100
  );

  const streamTabs: { key: RevenueStream; label: string; icon: React.ReactNode }[] = [
    { key: "plg", label: "PLG / Self-service", icon: <Sparkles className="h-4 w-4" /> },
    { key: "sales", label: "Sales", icon: <Users className="h-4 w-4" /> },
    { key: "partners", label: "Partners", icon: <Handshake className="h-4 w-4" /> },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="space-y-8">
          {/* Page Header */}
          <PageHeader
            title="Revenue"
            subtitle="Define how your PLG, sales, and partner streams generate ARR."
          />

          {/* Assumptions Snapshot Card */}
          <AssumptionsSnapshot />

          {/* Stream Tabs */}
          <div className="space-y-6">
            {/* Tab Navigation */}
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
                    {tab.key === "plg" ? "PLG" : tab.key === "sales" ? "Sales" : "Partners"}
                  </span>
                </button>
              ))}
            </div>

            {/* Stream Content */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              {activeStream === "plg" && (
                <PlgStreamForm
                  config={plgConfig}
                  setConfig={setPlgConfig}
                  newCustomers={plgNewCustomers}
                />
              )}
              {activeStream === "sales" && (
                <SalesStreamForm
                  config={salesConfig}
                  setConfig={setSalesConfig}
                  newCustomers={salesNewCustomers}
                />
              )}
              {activeStream === "partners" && (
                <PartnersStreamForm
                  config={partnersConfig}
                  setConfig={setPartnersConfig}
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
                  Each stream uses the global assumptions as defaults, but you can override
                  churn, expansion, and ACV per stream. The forecast combines all streams
                  to project your total MRR/ARR growth over time.
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
// Assumptions Snapshot Component
// ============================================================================

/**
 * Read-only snapshot of global assumptions relevant to revenue forecasting
 */
function AssumptionsSnapshot() {
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
              These defaults apply to all revenue streams
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SnapshotMetric
            label="Blended CAC"
            value={formatCurrency(DEFAULT_ASSUMPTIONS.cac)}
          />
          <SnapshotMetric
            label="Churn"
            value={formatPercentage(DEFAULT_ASSUMPTIONS.churnRate) + " / mo"}
          />
          <SnapshotMetric
            label="Expansion"
            value={formatPercentage(DEFAULT_ASSUMPTIONS.expansionRate) + " / mo"}
          />
          <SnapshotMetric
            label="Base ACV"
            value={formatCurrency(DEFAULT_ASSUMPTIONS.baseAcv)}
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
// PLG Stream Form
// ============================================================================

interface PlgStreamFormProps {
  config: PlgConfig;
  setConfig: React.Dispatch<React.SetStateAction<PlgConfig>>;
  newCustomers: number;
}

function PlgStreamForm({ config, setConfig, newCustomers }: PlgStreamFormProps) {
  const updateField = (field: keyof PlgConfig, value: string) => {
    const numValue = parseFloat(value) || 0;
    setConfig((prev) => ({ ...prev, [field]: numValue }));
  };

  return (
    <div className="space-y-6">
      <StreamHeader
        icon={<Sparkles className="h-5 w-5 text-emerald-600" />}
        iconBg="bg-emerald-50"
        title="PLG / Self-service"
        description="Product-led growth through free trials and self-service signups"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <StreamInputField
          label="Monthly new trials"
          value={config.monthlyTrials}
          onChange={(v) => updateField("monthlyTrials", v)}
          helper="Number of new trial signups per month"
        />
        <StreamInputField
          label="Trial → paid conversion"
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
          prefix="€"
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

      {/* Preview */}
      <StreamPreview
        icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
        color="emerald"
      >
        <span className="font-semibold text-emerald-700">{newCustomers}</span> new customers / month at{" "}
        <span className="font-semibold text-emerald-700">{formatCurrency(config.avgAcv)}</span> ACV
        <span className="text-slate-500">
          {" "}(using {formatPercentage(config.churnRate)} churn, {formatPercentage(config.expansionRate)} expansion)
        </span>
      </StreamPreview>
    </div>
  );
}

// ============================================================================
// Sales Stream Form
// ============================================================================

interface SalesStreamFormProps {
  config: SalesConfig;
  setConfig: React.Dispatch<React.SetStateAction<SalesConfig>>;
  newCustomers: number;
}

function SalesStreamForm({ config, setConfig, newCustomers }: SalesStreamFormProps) {
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

      {/* Preview */}
      <StreamPreview
        icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
        color="blue"
      >
        <span className="font-semibold text-blue-700">{newCustomers}</span> new customers / month at{" "}
        <span className="font-semibold text-blue-700">{formatCurrency(config.avgAcv)}</span> ACV
        <span className="text-slate-500">
          {" "}(using {formatPercentage(config.churnRate)} churn, {formatPercentage(config.expansionRate)} expansion)
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
  setConfig: React.Dispatch<React.SetStateAction<PartnersConfig>>;
  newCustomers: number;
}

function PartnersStreamForm({ config, setConfig, newCustomers }: PartnersStreamFormProps) {
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

      {/* Preview */}
      <StreamPreview
        icon={<TrendingUp className="h-4 w-4 text-violet-600" />}
        color="violet"
      >
        <span className="font-semibold text-violet-700">{newCustomers}</span> new customers / month at{" "}
        <span className="font-semibold text-violet-700">{formatCurrency(config.avgAcv)}</span> ACV
        <span className="text-slate-500">
          {" "}({formatPercentage(config.commissionRate)} partner commission)
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
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
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
      <label className="block text-sm font-medium text-slate-700">{label}</label>
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
    <div className={`flex items-center gap-3 p-4 rounded-xl border ${bgColorMap[color]}`}>
      <div className="flex-shrink-0">{icon}</div>
      <p className="text-sm text-slate-700">
        <span className="font-medium text-slate-500">Preview: </span>
        {children}
      </p>
    </div>
  );
}
