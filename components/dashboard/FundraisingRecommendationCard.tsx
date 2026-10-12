"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import posthog, { isPostHogConfigured } from "@/instrumentation-client";
import { formatCurrency, formatMonth } from "@/lib/assumptions";
import type { FundraisingRecommendation } from "@/lib/revenueForecast";

function copyFor(rec: FundraisingRecommendation): { headline: string; detail: string } {
  const gross = formatCurrency(rec.recommendedGrossAmount);
  const close = rec.recommendedCloseMonth ? formatMonth(rec.recommendedCloseMonth) : "—";
  const start = rec.recommendedStartMonth ? formatMonth(rec.recommendedStartMonth) : "—";
  const breach = rec.bufferBreachMonth ? formatMonth(rec.bufferBreachMonth) : null;
  const needsTarget =
    rec.status === "raise_recommended" && rec.targetRunwayMonths == null;
  const startSentence = rec.overdue
    ? "Start now — a full process would already have needed to begin."
    : `Start the process in ${start}.`;

  switch (rec.status) {
    case "inputs_missing":
      return {
        headline: "Set buffer and target runway",
        detail:
          "Add a minimum cash buffer and a target runway to get a raise recommendation.",
      };
    case "no_raise_needed":
      return {
        headline: "No raise needed",
        detail:
          "Cash stays above the buffer. The company does not go cash-negative on this plan.",
      };
    case "planned_round_sufficient":
      return {
        headline: "Planned round covers the target",
        detail: rec.plannedRound
          ? `The round in ${formatMonth(rec.plannedRound.month)} keeps cash at or above the buffer for the target runway.`
          : "The planned round keeps cash at or above the buffer for the target runway.",
      };
    case "planned_round_too_late":
      return {
        headline: `Bridge ${gross} by ${close}`,
        detail: `The planned round${
          rec.plannedRound ? ` in ${formatMonth(rec.plannedRound.month)}` : ""
        } lands after cash drops below the buffer${
          breach ? ` in ${breach}` : ""
        }. Close by ${close}. ${gross} more is the bridge; the planned proceeds still count once they arrive. ${startSentence}`,
      };
    case "additional_capital_needed":
      return {
        headline: `Raise ${gross} more by ${close}`,
        detail: `The planned round is on time but short of ${rec.targetRunwayMonths} months above the buffer. ${startSentence}`,
      };
    case "raise_recommended":
      if (needsTarget) {
        return {
          headline: breach ? `Buffer breach in ${breach}` : "Raise timing",
          detail: `Close by ${close}. ${startSentence} Set a target runway to size the raise.`,
        };
      }
      return {
        headline: `Raise ${gross} by ${close}`,
        detail: `${
          breach ? `Cash drops below the buffer in ${breach}. ` : ""
        }${startSentence} That amount holds ${rec.targetRunwayMonths} months above the buffer from the close.`,
      };
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-neutral-900">{value}</p>
    </div>
  );
}

export function FundraisingRecommendationCard({
  recommendation,
  variant = "full",
}: {
  recommendation: FundraisingRecommendation;
  variant?: "full" | "compact" | "sidebar";
}) {
  useEffect(() => {
    if (!isPostHogConfigured) return;
    posthog.capture("fundraising_recommendation_viewed", {
      status: recommendation.status,
    });
  }, [recommendation.status]);

  const copy = copyFor(recommendation);
  const needsTarget =
    recommendation.status === "raise_recommended" &&
    recommendation.targetRunwayMonths == null;
  const showAmount =
    recommendation.status !== "inputs_missing" &&
    recommendation.status !== "no_raise_needed" &&
    recommendation.status !== "planned_round_sufficient";
  const amountLabel = needsTarget
    ? "Set target runway"
    : recommendation.recommendedGrossAmount > 0
      ? formatCurrency(recommendation.recommendedGrossAmount)
      : "—";

  if (variant === "compact") {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Fundraising
          </p>
          <p className="mt-1 text-sm font-semibold text-neutral-900">{copy.headline}</p>
          <p className="mt-1 text-sm text-neutral-600">{copy.detail}</p>
        </div>
        <Link
          href="/app/runway"
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-turquoise-600 hover:text-turquoise-700"
        >
          View runway
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  const body = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-turquoise-700">
        Fundraising recommendation
      </p>
      <p className="mt-2 text-lg font-semibold text-neutral-900">{copy.headline}</p>
      <p className="mt-1 text-sm leading-relaxed text-neutral-600">{copy.detail}</p>
      {recommendation.status !== "inputs_missing" && (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat
            label="Buffer breach"
            value={
              recommendation.bufferBreachMonth
                ? formatMonth(recommendation.bufferBreachMonth)
                : "None"
            }
          />
          <Stat
            label="Start"
            value={
              recommendation.recommendedStartMonth
                ? formatMonth(recommendation.recommendedStartMonth)
                : "—"
            }
          />
          <Stat
            label="Close"
            value={
              recommendation.recommendedCloseMonth
                ? formatMonth(recommendation.recommendedCloseMonth)
                : "—"
            }
          />
          {showAmount ? (
            <Stat label="Gross amount" value={amountLabel} />
          ) : (
            <Stat
              label="Gross amount"
              value={
                recommendation.status === "no_raise_needed" ||
                recommendation.status === "planned_round_sufficient"
                  ? formatCurrency(0)
                  : "—"
              }
            />
          )}
        </div>
      )}
    </>
  );

  if (variant === "sidebar") {
    return <div>{body}</div>;
  }

  return (
    <div className="rounded-2xl border border-turquoise-200 bg-white p-6 shadow-sm">{body}</div>
  );
}
