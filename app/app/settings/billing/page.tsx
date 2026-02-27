"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  CreditCard,
  Check,
  Loader2,
  ExternalLink,
  Zap,
  Shield,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton, FormSectionSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

interface BillingStatus {
  tier: "free" | "growth";
  plan: {
    name: string;
    features: string[];
    maxPlans: number;
    maxScenarios: number;
  };
  subscription: {
    id: string;
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
  hasStripeAccount: boolean;
}

export default function BillingPage() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [managing, setManaging] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast("Subscription activated! Welcome to Growth.");
    }
    if (searchParams.get("cancelled") === "true") {
      toast("Checkout cancelled", "info");
    }
  }, [searchParams, toast]);

  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await fetch("/api/billing/status");
        const data = await res.json();
        if (data.success) setStatus(data.data);
      } catch {
        toast("Failed to load billing status", "error");
      } finally {
        setLoading(false);
      }
    }
    loadStatus();
  }, [toast]);

  const handleUpgrade = async (priceId: string) => {
    setUpgrading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      if (data.data.url) window.location.href = data.data.url;
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to start checkout",
        "error"
      );
    } finally {
      setUpgrading(false);
    }
  };

  const handleManage = async () => {
    setManaging(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      if (data.data.url) window.location.href = data.data.url;
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to open portal",
        "error"
      );
    } finally {
      setManaging(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-4xl px-6 py-8 space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>
          <FormSectionSkeleton />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="space-y-8">
          <PageHeader
            title="Billing"
            subtitle="Manage your subscription and billing details."
          />

          {/* Current plan */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    status?.tier === "growth"
                      ? "bg-indigo-100"
                      : "bg-slate-100"
                  }`}
                >
                  {status?.tier === "growth" ? (
                    <Zap className="h-5 w-5 text-indigo-600" />
                  ) : (
                    <Shield className="h-5 w-5 text-slate-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {status?.plan.name ?? "Free"} Plan
                  </h2>
                  <p className="text-sm text-slate-500">
                    {status?.tier === "growth"
                      ? "Full access to all features"
                      : "Basic features included"}
                  </p>
                </div>
              </div>

              {status?.subscription && (
                <div className="text-right">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      status.subscription.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-700"
                        : status.subscription.status === "PAST_DUE"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {status.subscription.status}
                  </span>
                  {status.subscription.cancelAtPeriodEnd && (
                    <p className="mt-1 text-xs text-amber-600">
                      Cancels at end of period
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <ul className="space-y-2">
                {status?.plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {status?.subscription?.currentPeriodEnd && (
              <p className="mt-4 text-xs text-slate-500">
                Current period ends:{" "}
                {new Date(
                  status.subscription.currentPeriodEnd
                ).toLocaleDateString("en-GB", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="grid gap-4 sm:grid-cols-2">
            {status?.tier === "free" ? (
              <>
                <PricingCard
                  title="Growth Monthly"
                  price="€29"
                  period="/month"
                  onSelect={() =>
                    handleUpgrade(
                      process.env
                        .NEXT_PUBLIC_STRIPE_GROWTH_MONTHLY_PRICE_ID ?? ""
                    )
                  }
                  loading={upgrading}
                />
                <PricingCard
                  title="Growth Annual"
                  price="€299"
                  period="/year"
                  badge="Save 14%"
                  onSelect={() =>
                    handleUpgrade(
                      process.env
                        .NEXT_PUBLIC_STRIPE_GROWTH_YEARLY_PRICE_ID ?? ""
                    )
                  }
                  loading={upgrading}
                />
              </>
            ) : (
              <div className="sm:col-span-2">
                <button
                  onClick={handleManage}
                  disabled={managing}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {managing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  Manage subscription
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function PricingCard({
  title,
  price,
  period,
  badge,
  onSelect,
  loading,
}: {
  title: string;
  price: string;
  period: string;
  badge?: string;
  onSelect: () => void;
  loading: boolean;
}) {
  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-indigo-200 transition">
      {badge && (
        <span className="absolute -top-2.5 right-4 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-medium text-white">
          {badge}
        </span>
      )}
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-slate-900">{price}</span>
        <span className="text-sm text-slate-500">{period}</span>
      </div>
      <button
        onClick={onSelect}
        disabled={loading}
        className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="mx-auto h-4 w-4 animate-spin" />
        ) : (
          "Upgrade now"
        )}
      </button>
    </div>
  );
}
