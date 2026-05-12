"use client";

import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { CheckCircle2, Circle, ArrowRight, Timer } from "lucide-react";

export interface OnboardingStatus {
  hasAssumptions: boolean;
  hasRevenue: boolean;
  hasExpenses: boolean;
}

const steps = [
  {
    key: "hasAssumptions" as const,
    label: "Set your assumptions",
    description: "Cash, churn, cost drivers, and plan horizon.",
    href: "/app/assumptions",
  },
  {
    key: "hasRevenue" as const,
    label: "Configure revenue streams",
    description: "Set up PLG, sales, and partner channels.",
    href: "/app/revenue",
  },
  {
    key: "hasExpenses" as const,
    label: "Add expenses",
    description: "Add headcount and operational costs.",
    href: "/app/expenses",
  },
];

function storageKey(planId: string) {
  return `onboarding-complete-dismissed:${planId}`;
}

function OnboardingChecklistSteps({
  status,
}: {
  status: OnboardingStatus;
}) {
  const completedCount = steps.filter((s) => status[s.key]).length;

  return (
    <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Get started with your forecast
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Complete these steps to generate your first financial projection.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-indigo-600">
          {completedCount}/{steps.length} complete
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {steps.map((step) => {
          const done = status[step.key];
          return (
            <Link
              key={step.key}
              href={step.href}
              className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition ${
                done
                  ? "border-emerald-200 bg-emerald-50/50"
                  : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30"
              }`}
            >
              {done ? (
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-500" />
              ) : (
                <Circle className="h-5 w-5 flex-shrink-0 text-slate-300" />
              )}
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${
                    done ? "text-emerald-700 line-through" : "text-slate-900"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-slate-500">{step.description}</p>
              </div>
              {!done && (
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-slate-400" />
              )}
            </Link>
          );
        })}
      </div>

      <div className="mt-4">
        <div className="h-1.5 w-full rounded-full bg-slate-200">
          <div
            className="h-1.5 rounded-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function OnboardingChecklist({
  status,
  planId,
}: {
  status: OnboardingStatus;
  planId: string | null;
}) {
  const completedCount = steps.filter((s) => status[s.key]).length;
  const allDone = completedCount === steps.length;

  const [completionReady, setCompletionReady] = useState(false);
  const [completionDismissed, setCompletionDismissed] = useState(false);

  useLayoutEffect(() => {
    if (!allDone || !planId) {
      setCompletionReady(false);
      setCompletionDismissed(false);
      return;
    }
    const dismissed = localStorage.getItem(storageKey(planId)) === "1";
    setCompletionDismissed(dismissed);
    setCompletionReady(true);
  }, [allDone, planId]);

  const dismissCompletion = () => {
    if (!planId) return;
    localStorage.setItem(storageKey(planId), "1");
    setCompletionDismissed(true);
  };

  if (!allDone) {
    return <OnboardingChecklistSteps status={status} />;
  }

  if (!planId) {
    return null;
  }

  if (!completionReady) {
    return (
      <div
        className="h-28 rounded-2xl border border-slate-200 bg-slate-50/80"
        aria-busy="true"
        aria-label="Loading completion state"
      />
    );
  }

  if (!completionDismissed) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                You&apos;re set up
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                View your runway and burn to see how the numbers come together.
              </p>
              <Link
                href="/app/runway"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
              >
                <Timer className="h-4 w-4" aria-hidden />
                View runway
              </Link>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissCompletion}
            className="self-start text-sm font-medium text-slate-500 transition hover:text-slate-800"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return null;
}
