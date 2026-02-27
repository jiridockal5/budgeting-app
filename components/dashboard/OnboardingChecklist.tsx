"use client";

import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

export interface OnboardingStatus {
  hasAssumptions: boolean;
  hasRevenue: boolean;
  hasExpenses: boolean;
}

const steps = [
  {
    key: "hasAssumptions" as const,
    label: "Set your assumptions",
    description: "Define CAC, churn, ACV, and salary drivers.",
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

export function OnboardingChecklist({ status }: { status: OnboardingStatus }) {
  const completedCount = steps.filter((s) => status[s.key]).length;
  const allDone = completedCount === steps.length;

  if (allDone) return null;

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
