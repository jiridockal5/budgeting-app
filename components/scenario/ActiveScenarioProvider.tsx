"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface ScenarioOption {
  id: string;
  name: string;
}

interface ActiveScenarioContextValue {
  planId: string | null;
  scenarios: ScenarioOption[];
  scenarioId: string | null;
  scenarioName: string | null;
  loading: boolean;
  setScenarioId: (id: string) => void;
  refreshScenarios: () => Promise<void>;
}

const ActiveScenarioContext = createContext<ActiveScenarioContextValue | null>(
  null
);

function storageKey(planId: string) {
  return `burnlytics:activeScenario:${planId}`;
}

export function ActiveScenarioProvider({ children }: { children: ReactNode }) {
  const [planId, setPlanId] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioOption[]>([]);
  const [scenarioId, setScenarioIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const pickActive = useCallback(
    (list: ScenarioOption[], preferredId: string | null) => {
      if (preferredId && list.some((s) => s.id === preferredId)) {
        return preferredId;
      }
      const def = list.find((s) => s.name === "Default");
      return def?.id ?? list[0]?.id ?? null;
    },
    []
  );

  const refreshScenarios = useCallback(async () => {
    try {
      setLoading(true);
      const planRes = await fetch("/api/plans/current");
      const planData = await planRes.json();
      if (!planData.success) throw new Error(planData.error);

      const id = planData.data.id as string;
      setPlanId(id);

      const scenRes = await fetch(`/api/scenarios?planId=${encodeURIComponent(id)}`);
      const scenData = await scenRes.json();
      if (!scenData.success) throw new Error(scenData.error);

      const list: ScenarioOption[] = (scenData.data as ScenarioOption[]).map(
        (s) => ({ id: s.id, name: s.name })
      );
      setScenarios(list);

      // Prefer in-memory selection (e.g. just created), then localStorage, then Default.
      setScenarioIdState((current) => {
        const stored =
          typeof window !== "undefined"
            ? window.localStorage.getItem(storageKey(id))
            : null;
        const next = pickActive(list, current ?? stored);
        if (next && typeof window !== "undefined") {
          window.localStorage.setItem(storageKey(id), next);
        }
        return next;
      });
    } catch (err) {
      console.error("Failed to load scenarios for switcher:", err);
      setScenarios([]);
      setScenarioIdState(null);
    } finally {
      setLoading(false);
    }
  }, [pickActive]);

  useEffect(() => {
    void refreshScenarios();
  }, [refreshScenarios]);

  const setScenarioId = useCallback(
    (id: string) => {
      setScenarioIdState(id);
      if (planId && typeof window !== "undefined") {
        window.localStorage.setItem(storageKey(planId), id);
      }
    },
    [planId]
  );

  const scenarioName = useMemo(
    () => scenarios.find((s) => s.id === scenarioId)?.name ?? null,
    [scenarios, scenarioId]
  );

  const value = useMemo(
    () => ({
      planId,
      scenarios,
      scenarioId,
      scenarioName,
      loading,
      setScenarioId,
      refreshScenarios,
    }),
    [
      planId,
      scenarios,
      scenarioId,
      scenarioName,
      loading,
      setScenarioId,
      refreshScenarios,
    ]
  );

  return (
    <ActiveScenarioContext.Provider value={value}>
      {children}
    </ActiveScenarioContext.Provider>
  );
}

export function useActiveScenario() {
  const ctx = useContext(ActiveScenarioContext);
  if (!ctx) {
    throw new Error("useActiveScenario must be used within ActiveScenarioProvider");
  }
  return ctx;
}
