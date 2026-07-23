"use client";

import { ChevronDown } from "lucide-react";
import { useActiveScenario } from "@/components/scenario/ActiveScenarioProvider";

export function ScenarioSwitcher() {
  const { scenarios, scenarioId, scenarioName, loading, setScenarioId } =
    useActiveScenario();

  if (loading || scenarios.length === 0) {
    return (
      <div className="hidden sm:flex items-center gap-2 rounded-full border border-turquoise-200 bg-white/70 px-3 py-1.5 text-xs text-neutral-500">
        Loading scenarios…
      </div>
    );
  }

  return (
    <div className="relative min-w-0">
      <label htmlFor="scenario-switcher" className="sr-only">
        Active scenario
      </label>
      <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
        <ChevronDown className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
      </div>
      <select
        id="scenario-switcher"
        value={scenarioId ?? ""}
        onChange={(e) => setScenarioId(e.target.value)}
        title={scenarioName ? `Editing: ${scenarioName}` : "Select scenario"}
        className="max-w-[160px] appearance-none truncate rounded-full border border-turquoise-200 bg-white py-1.5 pl-3 pr-7 text-sm font-medium text-neutral-900 shadow-sm transition hover:border-turquoise-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-turquoise-400 focus-visible:ring-offset-2 sm:max-w-[220px]"
      >
        {scenarios.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
