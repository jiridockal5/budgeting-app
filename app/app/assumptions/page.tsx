"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Save, Info, TrendingUp, Users, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { Skeleton, FormSectionSkeleton } from "@/components/ui/Skeleton";
import {
  GlobalAssumptions,
  DEFAULT_ASSUMPTIONS,
  ASSUMPTION_HELPERS,
  formatCurrency,
  formatPercentage,
} from "@/lib/assumptions";

/**
 * Assumptions Page
 * 
 * Captures global financial drivers that power revenue and expense forecasts.
 * Data is persisted to the database via /api/assumptions.
 */
export default function AssumptionsPage() {
  const [assumptions, setAssumptions] = useState<GlobalAssumptions>(DEFAULT_ASSUMPTIONS);
  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch current plan and assumptions on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Get or create the current plan
        const planRes = await fetch("/api/plans/current");
        const planData = await planRes.json();
        
        if (!planData.success) {
          throw new Error(planData.error || "Failed to load plan");
        }
        
        setPlanId(planData.data.id);

        // Fetch assumptions for this plan
        const assumptionsRes = await fetch(`/api/assumptions?planId=${planData.data.id}`);
        const assumptionsData = await assumptionsRes.json();
        
        if (!assumptionsData.success) {
          throw new Error(assumptionsData.error || "Failed to load assumptions");
        }

        // Update state with fetched assumptions
        setAssumptions({
          cashOnHand: assumptionsData.data.cashOnHand ?? 0,
          cac: assumptionsData.data.cac,
          churnRate: assumptionsData.data.churnRate,
          expansionRate: assumptionsData.data.expansionRate,
          baseAcv: assumptionsData.data.baseAcv,
          salaryTaxRate: assumptionsData.data.salaryTaxRate,
          salaryGrowthRate: assumptionsData.data.salaryGrowthRate,
          inflationRate: assumptionsData.data.inflationRate,
        });
      } catch (err) {
        console.error("Failed to load assumptions:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  /**
   * Updates a single field in the assumptions state
   */
  const updateField = (field: keyof GlobalAssumptions, value: string) => {
    const numValue = parseFloat(value) || 0;
    setAssumptions((prev) => ({ ...prev, [field]: numValue }));
  };

  /**
   * Handles form submission - saves to database
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!planId) {
      setError("No plan loaded");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const res = await fetch("/api/assumptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          ...assumptions,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to save assumptions");
      }

      toast("Assumptions saved successfully!");
    } catch (err) {
      console.error("Failed to save assumptions:", err);
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            <FormSectionSkeleton />
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
          {/* Page Header */}
          <PageHeader
            title="Assumptions"
            subtitle="Global drivers that power your revenue and expense forecasts."
          />

          {/* Two-column layout */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left column: Editable Form */}
            <section>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Revenue Drivers Section */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Revenue drivers</h2>
                      <p className="text-sm text-slate-500">Inputs for revenue forecasting</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <InputField
                      label="Cash on Hand"
                      value={assumptions.cashOnHand}
                      onChange={(v) => updateField("cashOnHand", v)}
                      helper={ASSUMPTION_HELPERS.cashOnHand}
                      prefix="€"
                      type="currency"
                    />
                    <InputField
                      label="Customer Acquisition Cost (CAC)"
                      value={assumptions.cac}
                      onChange={(v) => updateField("cac", v)}
                      helper={ASSUMPTION_HELPERS.cac}
                      prefix="€"
                      type="currency"
                    />
                    <InputField
                      label="Monthly Churn Rate"
                      value={assumptions.churnRate}
                      onChange={(v) => updateField("churnRate", v)}
                      helper={ASSUMPTION_HELPERS.churnRate}
                      suffix="%"
                      type="percentage"
                    />
                    <InputField
                      label="Monthly Expansion Rate"
                      value={assumptions.expansionRate}
                      onChange={(v) => updateField("expansionRate", v)}
                      helper={ASSUMPTION_HELPERS.expansionRate}
                      suffix="%"
                      type="percentage"
                    />
                    <InputField
                      label="Base ACV"
                      value={assumptions.baseAcv}
                      onChange={(v) => updateField("baseAcv", v)}
                      helper={ASSUMPTION_HELPERS.baseAcv}
                      prefix="€"
                      type="currency"
                    />
                  </div>
                </div>

                {/* People & Cost Drivers Section */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                      <Users className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">People & cost drivers</h2>
                      <p className="text-sm text-slate-500">Inputs for expense forecasting</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <InputField
                      label="Salary Tax Rate"
                      value={assumptions.salaryTaxRate}
                      onChange={(v) => updateField("salaryTaxRate", v)}
                      helper={ASSUMPTION_HELPERS.salaryTaxRate}
                      suffix="%"
                      type="percentage"
                    />
                    <InputField
                      label="Annual Salary Growth"
                      value={assumptions.salaryGrowthRate}
                      onChange={(v) => updateField("salaryGrowthRate", v)}
                      helper={ASSUMPTION_HELPERS.salaryGrowthRate}
                      suffix="%"
                      type="percentage"
                    />
                    <InputField
                      label="Annual Inflation Rate"
                      value={assumptions.inflationRate}
                      onChange={(v) => updateField("inflationRate", v)}
                      helper={ASSUMPTION_HELPERS.inflationRate}
                      suffix="%"
                      type="percentage"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save assumptions
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>

            {/* Right column: Summary & Effect */}
            <section>
              <div className="sticky top-24 space-y-6">
                {/* Summary Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900 mb-1">Summary & effect</h2>
                  <p className="text-sm text-slate-500 mb-6">Current values at a glance</p>

                  <div className="space-y-4">
                    <SummaryRow
                      label="Cash on hand"
                      value={formatCurrency(assumptions.cashOnHand)}
                      variant="highlight"
                    />
                    <SummaryRow
                      label="Blended CAC"
                      value={formatCurrency(assumptions.cac)}
                      variant="highlight"
                    />
                    <SummaryRow
                      label="Churn"
                      value={formatPercentage(assumptions.churnRate) + " / month"}
                    />
                    <SummaryRow
                      label="Expansion"
                      value={formatPercentage(assumptions.expansionRate) + " / month"}
                    />
                    <SummaryRow
                      label="Base ACV"
                      value={formatCurrency(assumptions.baseAcv)}
                      variant="highlight"
                    />
                    
                    <div className="border-t border-slate-100 pt-4 mt-4" />
                    
                    <SummaryRow
                      label="Total payroll on-top cost"
                      value={formatPercentage(assumptions.salaryTaxRate)}
                    />
                    <SummaryRow
                      label="Salary growth"
                      value={formatPercentage(assumptions.salaryGrowthRate) + " / year"}
                    />
                    <SummaryRow
                      label="Inflation"
                      value={formatPercentage(assumptions.inflationRate) + " / year"}
                    />
                  </div>
                </div>

                {/* Explanation Card */}
                <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                      <Info className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">How this fits in</h3>
                      <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                        These global assumptions are used when projecting{" "}
                        <span className="font-medium text-slate-900">Revenue</span> (PLG, Sales, Partners) and{" "}
                        <span className="font-medium text-slate-900">Expenses</span> (headcount & costs).
                        You can override specific values per stream or category directly on the Revenue and Expenses pages.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="flex gap-3">
                  <Link
                    href="/app/revenue"
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
                  >
                    Go to Revenue
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/app/expenses"
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
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

// ============================================================================
// Helper Components
// ============================================================================

interface InputFieldProps {
  label: string;
  value: number;
  onChange: (value: string) => void;
  helper: string;
  prefix?: string;
  suffix?: string;
  type: "currency" | "percentage";
}

/**
 * Reusable input field component with label, prefix/suffix, and helper text
 */
function InputField({ label, value, onChange, helper, prefix, suffix }: InputFieldProps) {
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

interface SummaryRowProps {
  label: string;
  value: string;
  variant?: "default" | "highlight";
}

/**
 * Reusable summary row for the right-side panel
 */
function SummaryRow({ label, value, variant = "default" }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-600">{label}</span>
      <span
        className={`text-sm font-semibold ${
          variant === "highlight" ? "text-indigo-600" : "text-slate-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

