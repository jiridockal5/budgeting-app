"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import posthog, { isPostHogConfigured } from "@/instrumentation-client";
import { buildFundraisingCopy, type FundraisingTone } from "@/lib/fundraisingCopy";
import type { FundraisingRecommendation } from "@/lib/revenueForecast";

const HEADLINE_COLOR: Record<FundraisingTone, string> = {
  green: "text-emerald-700",
  amber: "text-amber-800",
  red: "text-rose-700",
  grey: "text-neutral-500",
};

const CARD_BORDER: Record<FundraisingTone, string> = {
  green: "border-emerald-200",
  amber: "border-amber-200",
  red: "border-rose-200",
  grey: "border-neutral-200",
};

function KeyNumber({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption?: string | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900">{value}</p>
      {caption ? <p className="mt-1 text-xs text-neutral-500">{caption}</p> : null}
    </div>
  );
}

export function FundraisingRecommendationCard({
  recommendation,
  variant = "full",
  lastForecastMonth = null,
}: {
  recommendation: FundraisingRecommendation;
  variant?: "full" | "compact" | "sidebar";
  lastForecastMonth?: string | null;
}) {
  useEffect(() => {
    if (!isPostHogConfigured) return;
    posthog.capture("fundraising_recommendation_viewed", {
      status: recommendation.status,
    });
  }, [recommendation.status]);

  const copy = buildFundraisingCopy(recommendation, { lastForecastMonth });

  if (variant === "compact") {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Fundraising
          </p>
          <Link
            href="/app/runway"
            className="mt-1 block text-sm font-semibold text-neutral-900 hover:text-turquoise-700"
          >
            {copy.dashboardLine}
          </Link>
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
      <p className={`mt-2 text-lg font-semibold ${HEADLINE_COLOR[copy.tone]}`}>{copy.headline}</p>
      {copy.showKeyNumbers && (
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <KeyNumber label="Raise" value={copy.raiseAmount} caption={copy.raiseCaption} />
          <KeyNumber label="Money in the bank by" value={copy.closeMonthLabel} />
          <KeyNumber label="Start fundraising" value={copy.startLabel} />
        </div>
      )}
      {copy.why ? <p className="mt-4 text-sm text-neutral-700">{copy.why}</p> : null}
      {copy.lastsLine ? <p className="mt-2 text-sm text-neutral-700">{copy.lastsLine}</p> : null}
      {copy.details.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-neutral-600">
            How we calculated this
          </summary>
          <ul className="mt-2 space-y-1 text-sm text-neutral-600">
            {copy.details.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </details>
      )}
      {copy.largeRaiseWarningText ? (
        <p className="mt-4 text-sm text-neutral-600">
          This is a large raise driven by cost growth. Review your{" "}
          <Link href="/app/expenses" className="font-medium text-turquoise-700 hover:underline">
            hiring plan and expenses
          </Link>
          .
        </p>
      ) : null}
    </>
  );

  if (variant === "sidebar") {
    return <div>{body}</div>;
  }

  return (
    <div className={`rounded-2xl border bg-white p-6 shadow-sm ${CARD_BORDER[copy.tone]}`}>
      {body}
    </div>
  );
}
