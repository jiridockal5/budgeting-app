"use client";

import { useState } from "react";
import { Lightbulb, X } from "lucide-react";

export function PlgOnboardingHint() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 flex items-start gap-3">
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-indigo-100 mt-0.5">
        <Lightbulb className="h-3.5 w-3.5 text-indigo-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-indigo-900 font-medium">
          Getting started with the forecast grid
        </p>
        <p className="text-xs text-indigo-700/80 mt-0.5 leading-relaxed">
          Start with a default value for each metric. Then use the row menu
          (&bull;&bull;&bull;) to apply growth rates, seasonality, or fill
          values. Double-click any cell to override a specific month.
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 p-0.5 rounded text-indigo-400 hover:text-indigo-600 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
