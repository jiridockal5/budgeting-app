"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useCallback, type ReactNode } from "react";
import {
  ArrowRight,
  CalendarRange,
  Check,
  Info,
  Loader2,
  Receipt,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { Skeleton, FormSectionSkeleton } from "@/components/ui/Skeleton";
import {
  ASSUMPTION_HELPERS,
  DEFAULT_ASSUMPTIONS,
  formatCurrency,
  formatMonth,
  formatPercentage,
  GlobalAssumptions,
  normalizeAssumptions,
} from "@/lib/assumptions";
import { dateToMonth } from "@/lib/revenueForecast";
import { useAutoSave, useAutoSaveLabel } from "@/lib/useAutoSave";

type NumericField =
  | "cashOnHand"
  | "plannedRaiseAmount"
  | "fundraisingFees"
  | "targetRunwayMonths"
  | "churnRate"
  | "paymentTimingDays"
  | "priceUplift"
  | "salaryTaxRate"
  | "salaryGrowthRate"
  | "commissionRate"
  | "inflationRate";

export default function AssumptionsPage() {
  const [assumptions, setAssumptions] =
    useState<GlobalAssumptions>(DEFAULT_ASSUMPTIONS);
  const [planId, setPlanId] = useState<string | null>(null);
  const [planSettings, setPlanSettings] = useState({ startMonth: "", months: 24 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const planRes = await fetch("/api/plans/current");
        const planData = await planRes.json();

        if (!planData.success) {
          throw new Error(planData.error || "Failed to load plan");
        }

        setPlanId(planData.data.id);
        setPlanSettings({
          startMonth: dateToMonth(planData.data.startMonth),
          months: planData.data.months,
        });

        const assumptionsRes = await fetch(
          `/api/assumptions?planId=${planData.data.id}`
        );
        const assumptionsData = await assumptionsRes.json();

        if (!assumptionsData.success) {
          throw new Error(assumptionsData.error || "Failed to load assumptions");
        }

        setAssumptions(normalizeAssumptions(assumptionsData.data));
      } catch (err) {
        console.error("Failed to load assumptions:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const updateNumericField = (
    field: NumericField,
    value: string,
    options?: { nullable?: boolean }
  ) => {
    setAssumptions((prev) => {
      if (options?.nullable && value === "") {
        return { ...prev, [field]: null };
      }

      return { ...prev, [field]: parseFloat(value) || 0 };
    });
  };

  const updatePlannedRaiseMonth = (value: string) => {
    setAssumptions((prev) => ({
      ...prev,
      plannedRaiseMonth: value || null,
    }));
  };

  // ── Auto-save ──
  const saveAssumptions = useCallback(async () => {
    if (!planId) return;
    const res = await fetch("/api/assumptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, ...assumptions }),
    });
    const data = await res.json();
    if (!data.success)
      throw new Error(data.error || "Failed to save assumptions");
  }, [planId, assumptions]);

  const autoSave = useAutoSave(assumptions, saveAssumptions, {
    enabled: !loading && !!planId,
  });

  const savePlanSettings = useCallback(async () => {
    if (!planId) return;
    const res = await fetch("/api/plans/current", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(planSettings),
    });
    const data = await res.json();
    if (!data.success)
      throw new Error(data.error || "Failed to save plan settings");
  }, [planId, planSettings]);

  const planAutoSave = useAutoSave(planSettings, savePlanSettings, {
    enabled: !loading && !!planId,
  });

  const combinedSaving = autoSave.saving || planAutoSave.saving;
  const combinedLastSaved = autoSave.lastSaved && planAutoSave.lastSaved
    ? new Date(Math.max(autoSave.lastSaved.getTime(), planAutoSave.lastSaved.getTime()))
    : autoSave.lastSaved || planAutoSave.lastSaved;
  const combinedError = autoSave.error || planAutoSave.error;
  const saveLabel = useAutoSaveLabel({
    saving: combinedSaving,
    lastSaved: combinedLastSaved,
    error: combinedError,
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <FormSectionSkeleton />
              <FormSectionSkeleton />
              <FormSectionSkeleton />
            </div>
            <div className="space-y-6">
              <FormSectionSkeleton />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="space-y-8">
          <PageHeader
            title="Assumptions"
            subtitle="Global defaults that shape runway, fundraising, and the core drivers behind your forecast."
            actions={
              saveLabel ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                  {combinedSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  )}
                  {saveLabel}
                </span>
              ) : null
            }
          />

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section>
              <div className="space-y-6">
                <SectionCard
                  title="Forecast settings"
                  description="Define the time horizon for your financial model."
                  icon={<CalendarRange className="h-5 w-5 text-sky-600" />}
                  iconBg="bg-sky-50"
                  featured
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <InputField
                      label="Forecast start month"
                      value={planSettings.startMonth}
                      onChange={(value) =>
                        setPlanSettings((prev) => ({
                          ...prev,
                          startMonth: value || prev.startMonth,
                        }))
                      }
                      helper="The first month of your forecast period."
                      type="month"
                    />
                    <InputField
                      label="Forecast duration"
                      value={planSettings.months}
                      onChange={(value) => {
                        const n = parseInt(value, 10);
                        if (!value) return;
                        setPlanSettings((prev) => ({
                          ...prev,
                          months: Math.max(1, Math.min(120, isNaN(n) ? prev.months : n)),
                        }));
                      }}
                      helper="How far into the future to project (1-120). Common values: 12, 24, 36, 60."
                      suffix="months"
                      type="number"
                    />
                  </div>
                </SectionCard>

                <SectionCard
                  title="Cash & fundraising"
                  description="Set the cash position and funding targets that define how much room you have to operate."
                  icon={<Wallet className="h-5 w-5 text-indigo-600" />}
                  iconBg="bg-indigo-50"
                >
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
                    <p className="text-sm font-semibold text-indigo-900">
                      Why this matters
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-indigo-900/80">
                      A founder usually wants to know: “When do I run out of cash,
                      and how much should I raise?”
                    </p>
                  </div>

                  {/* TODO: Reintroduce minCashBuffer under an "Advanced settings" section in a future version. */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <InputField
                      label="Starting cash"
                      value={assumptions.cashOnHand}
                      onChange={(value) => updateNumericField("cashOnHand", value)}
                      helper={ASSUMPTION_HELPERS.cashOnHand}
                      prefix="€"
                      type="number"
                    />
                    <InputField
                      label="Planned raise month"
                      value={assumptions.plannedRaiseMonth}
                      onChange={updatePlannedRaiseMonth}
                      helper={ASSUMPTION_HELPERS.plannedRaiseMonth}
                      type="month"
                    />
                    <InputField
                      label="Planned raise amount"
                      value={assumptions.plannedRaiseAmount}
                      onChange={(value) =>
                        updateNumericField("plannedRaiseAmount", value, {
                          nullable: true,
                        })
                      }
                      helper={ASSUMPTION_HELPERS.plannedRaiseAmount}
                      prefix="€"
                      type="number"
                      optional
                    />
                    <InputField
                      label="Fundraising fees / dilution fees"
                      value={assumptions.fundraisingFees}
                      onChange={(value) =>
                        updateNumericField("fundraisingFees", value)
                      }
                      helper={ASSUMPTION_HELPERS.fundraisingFees}
                      suffix="%"
                      type="number"
                    />
                    <InputField
                      label="Target runway"
                      value={assumptions.targetRunwayMonths}
                      onChange={(value) =>
                        updateNumericField("targetRunwayMonths", value, {
                          nullable: true,
                        })
                      }
                      helper={ASSUMPTION_HELPERS.targetRunwayMonths}
                      suffix="mo"
                      type="number"
                      optional
                    />
                  </div>
                </SectionCard>

                <SectionCard
                  title="Revenue defaults"
                  description="Only keep baseline revenue assumptions here when they truly apply across the model."
                  icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
                  iconBg="bg-emerald-50"
                >
                  {/* TODO: Monthly expansion rate is hidden from global assumptions for v1.
                      It is still used in forecast calculations via the default value.
                      Consider moving expansion rate to per-stream Revenue config. */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <InputField
                      label="Default churn"
                      value={assumptions.churnRate}
                      onChange={(value) => updateNumericField("churnRate", value)}
                      helper={ASSUMPTION_HELPERS.churnRate}
                      suffix="%"
                      type="number"
                    />
                    <InputField
                      label="Payment timing / collection lag"
                      value={assumptions.paymentTimingDays}
                      onChange={(value) =>
                        updateNumericField("paymentTimingDays", value)
                      }
                      helper={ASSUMPTION_HELPERS.paymentTimingDays}
                      suffix="days"
                      type="number"
                    />
                    <InputField
                      label="Price uplift / annual price increase"
                      value={assumptions.priceUplift}
                      onChange={(value) =>
                        updateNumericField("priceUplift", value, {
                          nullable: true,
                        })
                      }
                      helper={ASSUMPTION_HELPERS.priceUplift}
                      suffix="%"
                      type="number"
                      optional
                    />
                  </div>
                </SectionCard>

                <SectionCard
                  title="Team defaults"
                  description="Keep shared people assumptions here, then override them later by role when needed."
                  icon={<Users className="h-5 w-5 text-violet-600" />}
                  iconBg="bg-violet-50"
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <InputField
                      label="Employer tax rate"
                      value={assumptions.salaryTaxRate}
                      onChange={(value) =>
                        updateNumericField("salaryTaxRate", value)
                      }
                      helper={ASSUMPTION_HELPERS.salaryTaxRate}
                      suffix="%"
                      type="number"
                    />
                    <InputField
                      label="Annual salary increase"
                      value={assumptions.salaryGrowthRate}
                      onChange={(value) =>
                        updateNumericField("salaryGrowthRate", value)
                      }
                      helper={ASSUMPTION_HELPERS.salaryGrowthRate}
                      suffix="%"
                      type="number"
                    />
                    <InputField
                      label="Commission / bonus"
                      value={assumptions.commissionRate}
                      onChange={(value) =>
                        updateNumericField("commissionRate", value)
                      }
                      helper={ASSUMPTION_HELPERS.commissionRate}
                      suffix="%"
                      type="number"
                    />
                  </div>
                </SectionCard>

                <SectionCard
                  title="Expense defaults"
                  description="Use this section only for broad operating cost assumptions that repeat across the model."
                  icon={<Receipt className="h-5 w-5 text-amber-600" />}
                  iconBg="bg-amber-50"
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <InputField
                      label="General opex inflation"
                      value={assumptions.inflationRate}
                      onChange={(value) =>
                        updateNumericField("inflationRate", value)
                      }
                      helper={ASSUMPTION_HELPERS.inflationRate}
                      suffix="%"
                      type="number"
                    />
                  </div>
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
                    TODO: detailed category-level expense assumptions and any
                    month-by-month inputs should live on the Expenses page instead
                    of here.
                  </p>
                </SectionCard>

                {(error || combinedError) && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
                    <span>{error || combinedError}</span>
                    <button
                      onClick={() => setError(null)}
                      className="text-red-500 hover:text-red-700 font-medium"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </section>

            <section>
              <div className="sticky top-24 space-y-6">
                <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                      <Target className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Funding focus
                      </h2>
                      <p className="text-sm text-slate-500">
                        The key defaults that shape runway and fundraising decisions.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4">
                    <DecisionPoint
                      title="Starting cash"
                      value={formatCurrency(assumptions.cashOnHand)}
                      detail="Cash available at the start of the forecast."
                    />
                    <DecisionPoint
                      title="Planned raise"
                      value={formatMonth(assumptions.plannedRaiseMonth)}
                      detail={
                        assumptions.plannedRaiseAmount != null
                          ? `${formatCurrency(assumptions.plannedRaiseAmount)} gross proceeds`
                          : "Amount not set"
                      }
                    />
                    <DecisionPoint
                      title="Funding fees"
                      value={formatPercentage(assumptions.fundraisingFees)}
                      detail="Transaction costs or dilution friction."
                    />
                    <DecisionPoint
                      title="Target runway"
                      value={formatOptionalMonths(assumptions.targetRunwayMonths)}
                      detail="Desired months the company should remain funded."
                    />
                  </div>

                  {/* TODO: Wire runway, cash-out month, and suggested raise needed from forecast summary.
                      These require loading forecast results on this page or computing inline. */}
                  <div className="mt-4 space-y-3 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                      Derived outputs
                    </p>
                    <DecisionPoint
                      title="Runway"
                      value="—"
                      detail="Projected months of funding remaining."
                    />
                    <DecisionPoint
                      title="Cash-out month"
                      value="—"
                      detail="Estimated month when cash reaches zero."
                    />
                    <DecisionPoint
                      title="Suggested raise needed"
                      value="—"
                      detail="Estimated funding required to hit target runway."
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Current global defaults
                  </h3>

                  <div className="mt-5 space-y-5">
                    <SummaryGroup title="Forecast settings">
                      <SummaryRow
                        label="Start month"
                        value={formatMonth(planSettings.startMonth)}
                        variant="highlight"
                      />
                      <SummaryRow
                        label="Duration"
                        value={`${planSettings.months} months`}
                        variant="highlight"
                      />
                    </SummaryGroup>

                    <SummaryGroup title="Cash & fundraising">
                      <SummaryRow
                        label="Starting cash"
                        value={formatCurrency(assumptions.cashOnHand)}
                        variant="highlight"
                      />
                      <SummaryRow
                        label="Planned raise month"
                        value={formatMonth(assumptions.plannedRaiseMonth)}
                      />
                      <SummaryRow
                        label="Planned raise amount"
                        value={formatOptionalCurrency(assumptions.plannedRaiseAmount)}
                      />
                      <SummaryRow
                        label="Funding fees"
                        value={formatPercentage(assumptions.fundraisingFees)}
                      />
                      <SummaryRow
                        label="Target runway"
                        value={formatOptionalMonths(assumptions.targetRunwayMonths)}
                      />
                    </SummaryGroup>

                    <SummaryGroup title="Revenue defaults">
                      <SummaryRow
                        label="Default churn"
                        value={`${formatPercentage(assumptions.churnRate)} / month`}
                      />
                      <SummaryRow
                        label="Collection lag"
                        value={`${assumptions.paymentTimingDays} days`}
                      />
                      <SummaryRow
                        label="Price uplift"
                        value={formatOptionalPercentage(assumptions.priceUplift)}
                      />
                    </SummaryGroup>

                    <SummaryGroup title="Team defaults">
                      <SummaryRow
                        label="Annual salary increase"
                        value={`${formatPercentage(
                          assumptions.salaryGrowthRate
                        )} / year`}
                      />
                      <SummaryRow
                        label="Employer tax rate"
                        value={formatPercentage(assumptions.salaryTaxRate)}
                      />
                      <SummaryRow
                        label="Commission / bonus"
                        value={formatPercentage(assumptions.commissionRate)}
                      />
                    </SummaryGroup>

                    <SummaryGroup title="Expense defaults">
                      <SummaryRow
                        label="General opex inflation"
                        value={`${formatPercentage(assumptions.inflationRate)} / year`}
                      />
                    </SummaryGroup>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                      <Info className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        How this fits in
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        This page is for global defaults only. Put stream-specific
                        revenue assumptions on the Revenue page and detailed cost
                        assumptions on the Expenses page so this stays focused on
                        runway, fundraising, and reusable model drivers.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link
                    href="/app/revenue"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Go to Revenue
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/app/expenses"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Go to Expenses
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

interface SectionCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  iconBg: string;
  featured?: boolean;
  children: ReactNode;
}

function SectionCard({
  title,
  description,
  icon,
  iconBg,
  featured = false,
  children,
}: SectionCardProps) {
  return (
    <div
      className={`rounded-2xl bg-white p-6 shadow-sm ${
        featured
          ? "border-2 border-indigo-100"
          : "border border-slate-200"
      }`}
    >
      <div className="mb-6 flex items-center gap-3">
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

      <div className="space-y-5">{children}</div>
    </div>
  );
}

interface InputFieldProps {
  label: string;
  value: number | string | null;
  onChange: (value: string) => void;
  helper: string;
  prefix?: string;
  suffix?: string;
  type: "number" | "month";
  optional?: boolean;
}

function InputField({
  label,
  value,
  onChange,
  helper,
  prefix,
  suffix,
  type,
  optional = false,
}: InputFieldProps) {
  const displayValue =
    value == null ? "" : typeof value === "number" ? String(value) : value;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
        {optional && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            Optional
          </span>
        )}
      </div>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
            {prefix}
          </span>
        )}
        {type === "month" ? (
          <MonthPicker
            value={typeof value === "string" ? value : null}
            onChange={onChange}
            placeholder="Select month"
            allowClear={optional || label === "Planned raise month"}
          />
        ) : (
          <>
            <input
              type={type}
              value={displayValue}
              onChange={(e) => onChange(e.target.value)}
              step={type === "number" ? "any" : undefined}
              min={type === "number" ? "0" : undefined}
              className={`w-full rounded-xl bg-white py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
                optional
                  ? "border border-dashed border-slate-300"
                  : "border border-slate-200"
              } ${prefix ? "pl-8" : "pl-3"} ${suffix ? "pr-12" : "pr-3"}`}
            />
            {suffix && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                {suffix}
              </span>
            )}
          </>
        )}
      </div>
      <p className="text-xs leading-relaxed text-slate-500">{helper}</p>
    </div>
  );
}

function DecisionPoint({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="mt-1 text-base font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">{detail}</p>
    </div>
  );
}

function SummaryGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
  variant?: "default" | "highlight";
}

function SummaryRow({ label, value, variant = "default" }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-600">{label}</span>
      <span
        className={`text-right text-sm font-semibold ${
          variant === "highlight" ? "text-indigo-600" : "text-slate-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function formatOptionalCurrency(value: number | null): string {
  return value == null ? "Not set" : formatCurrency(value);
}

function formatOptionalPercentage(value: number | null): string {
  return value == null ? "Not set" : formatPercentage(value);
}

function formatOptionalMonths(value: number | null): string {
  return value == null ? "Not set" : `${value} mo`;
}


