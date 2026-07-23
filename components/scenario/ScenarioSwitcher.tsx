"use client";

import { GitBranch } from "lucide-react";
import { useActiveScenario } from "@/components/scenario/ActiveScenarioProvider";
import { ScenarioSelect } from "@/components/scenario/ScenarioSelect";

export function ScenarioSwitcher() {
  const { scenarios, scenarioId, scenarioName, loading, setScenarioId } =
    useActiveScenario();

  if (loading || scenarios.length === 0) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-turquoise-200/80 bg-white/80 px-3 py-1.5 text-xs text-neutral-500 shadow-sm">
        Loading scenarios…
      </div>
    );
  }

  return (
    <ScenarioSelect
      options={scenarios}
      value={scenarioId ?? ""}
      onChange={setScenarioId}
      label="Active scenario"
      menuLabel="Switch scenario"
      placeholder={scenarioName ?? "Select scenario"}
      leading={
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-turquoise-100 text-turquoise-700">
          <GitBranch className="h-3 w-3" aria-hidden />
        </span>
      }
      buttonClassName="inline-flex max-w-[200px] items-center gap-2 rounded-full border border-turquoise-200 bg-white py-1.5 pl-2.5 pr-2 text-sm font-medium text-neutral-900 shadow-sm transition hover:border-turquoise-300 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-turquoise-400 focus-visible:ring-offset-2 sm:max-w-[260px]"
    />
  );
}
