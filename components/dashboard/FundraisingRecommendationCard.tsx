"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import posthog, { isPostHogConfigured } from "@/instrumentation-client";
import {
  buildFundraisingCopy,
  type DerivationStep,
  type FundraisingTone,
} from "@/lib/fundraisingCopy";
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

function Derivation({ step }: { step: DerivationStep }) {
  return (
    <li className="border-t border-neutral-200 pt-3 first:border-t-0 first:pt-0">
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-medium text-neutral-800">
          <span className="mr-1.5 tabular-nums text-neutral-500">{step.number}.</span>
          {step.title}
        </p>
        <p
          className="shrink-0 text-right text-sm font-semibold tabular-nums text-neutral-900"
          title={step.resultExact ?? undefined}
        >
          {step.result}
        </p>
      </div>
      {step.rows.length > 0 && (
        <dl className="mt-2 space-y-1">
          {step.rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4">
              <dt className="text-neutral-600">{row.label}</dt>
              <dd
                className={`text-right tabular-nums ${
                  row.negative ? "font-medium text-rose-700" : "text-neutral-800"
                }`}
                title={row.exact ?? undefined}
              >
                {row.value}
                {row.exact ? (
                  <span className="mt-0.5 block text-[11px] font-normal text-neutral-600">
                    {row.exact}
                  </span>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      )}
      <p className="mt-2 text-neutral-600">{step.equation}</p>
    </li>
  );
}

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
      {copy.derivation && (
        <details className="mt-4">
          <summary className="cursor-pointer rounded-sm text-sm font-medium text-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-turquoise-600">
            How we calculated this
          </summary>
          <div className="mt-3 text-[13px] leading-relaxed">
            <ol>
              {copy.derivation.steps.map((step) => (
                <Derivation key={step.number} step={step} />
              ))}
            </ol>
            {copy.derivation.plannedNote ? (
              <p className="mt-3 border-t border-neutral-200 pt-3 text-neutral-600">
                {copy.derivation.plannedNote}
              </p>
            ) : null}
            {copy.derivation.footnote ? (
              <p className="mt-3 flex items-start gap-1.5 border-t border-neutral-200 pt-3 text-neutral-600">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{copy.derivation.footnote}</span>
              </p>
            ) : null}
          </div>
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
