"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  CreditCard,
  Check,
  Loader2,
  ExternalLink,
  Zap,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton, FormSectionSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { SubscribeCheckout } from "@/components/billing/SubscribeCheckout";
import type { AccessState } from "@/config/plans";

interface BillingStatus {
  state: AccessState;
  hasAppAccess: boolean;
  isOnTrial: boolean;
  isPaid: boolean;
  trialDaysLeft: number | null;
  trialEndsAt: string | null;
  plan: {
    name: string;
    features: string[];
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
  const [managing, setManaging] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast("Subscription activated! Welcome to Burnlytics.");
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
      <main className="min-h-screen bg-neutral-50">
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

  const statusLabel =
    status?.state === "paid"
      ? "Active subscription"
      : status?.state === "trial"
        ? `Trial — ${status.trialDaysLeft ?? 0} day(s) left`
        : "Trial ended — subscribe to continue";

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="space-y-8">
          <PageHeader
            title="Billing"
            subtitle="Manage your subscription and billing details."
          />

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    status?.state === "paid"
                      ? "bg-turquoise-100"
                      : status?.state === "trial"
                        ? "bg-amber-100"
                        : "bg-neutral-100"
                  }`}
                >
                  {status?.state === "paid" ? (
                    <Zap className="h-5 w-5 text-turquoise-600" />
                  ) : status?.state === "trial" ? (
                    <Clock className="h-5 w-5 text-amber-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-neutral-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">
                    {status?.plan.name ?? "Burnlytics"}
                  </h2>
                  <p className="text-sm text-neutral-500">{statusLabel}</p>
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
                          : "bg-neutral-100 text-neutral-700"
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

            <div className="mt-4 border-t border-neutral-100 pt-4">
              <ul className="space-y-2">
                {status?.plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-sm text-neutral-600"
                  >
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {status?.subscription?.currentPeriodEnd && (
              <p className="mt-4 text-xs text-neutral-500">
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

          {status?.state === "paid" ? (
            <button
              onClick={handleManage}
              disabled={managing}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 disabled:opacity-50"
            >
              {managing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              Manage subscription
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          ) : (
            <SubscribeCheckout
              locked={status?.state === "locked"}
              showTrialNote={status?.state === "trial"}
            />
          )}
        </div>
      </div>
    </main>
  );
}
