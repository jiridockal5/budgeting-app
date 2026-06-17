"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  type BillingCurrency,
  type BillingInterval,
  formatPrice,
  getCurrencySymbol,
  getPublicStripePriceId,
  PLAN_FEATURES,
  PLAN_NAME,
  TRIAL_DAYS,
} from "@/config/plans";

interface SubscribeCheckoutProps {
  variant?: "default" | "compact";
  showTrialNote?: boolean;
  locked?: boolean;
}

export function SubscribeCheckout({
  variant = "default",
  showTrialNote = true,
  locked = false,
}: SubscribeCheckoutProps) {
  const [currency, setCurrency] = useState<BillingCurrency>("eur");
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const price = formatPrice(currency, interval);
  const symbol = getCurrencySymbol(currency);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const priceId = getPublicStripePriceId(currency, interval);
      if (!priceId) {
        throw new Error("Checkout is not configured yet. Contact support.");
      }
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      if (data.data.url) window.location.href = data.data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={
        variant === "compact"
          ? "space-y-4"
          : "rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
      }
    >
      {variant === "default" && (
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">{PLAN_NAME}</h2>
          <p className="mt-1 text-sm text-neutral-500">
            {locked
              ? "Your trial has ended. Subscribe to continue using Burnlytics."
              : "Full access to forecasting, metrics, and exports."}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <div className="inline-flex rounded-full border border-neutral-200 bg-neutral-50 p-1">
          {(["eur", "usd"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium uppercase transition-colors ${
                currency === c
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-full border border-neutral-200 bg-neutral-50 p-1">
          {(["monthly", "annual"] as const).map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setInterval(i)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                interval === i
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold text-neutral-900">
          {symbol}
          {price.amount}
        </span>
        <span className="text-sm text-neutral-500">{price.period}</span>
      </div>
      {interval === "annual" && price.effectiveMonthly && (
        <p className="text-sm text-emerald-700">
          {symbol}
          {price.effectiveMonthly}/mo billed annually — save ~20% vs monthly
        </p>
      )}

      {variant === "default" && (
        <ul className="space-y-2 border-t border-neutral-100 pt-4">
          {PLAN_FEATURES.map((feature) => (
            <li key={feature} className="text-sm text-neutral-600">
              {feature}
            </li>
          ))}
        </ul>
      )}

      {showTrialNote && !locked && (
        <p className="text-xs text-neutral-500">
          {TRIAL_DAYS}-day free trial on signup. No credit card required to start.
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="mx-auto h-4 w-4 animate-spin" />
        ) : locked ? (
          "Subscribe to continue"
        ) : (
          "Subscribe now"
        )}
      </button>
    </div>
  );
}
