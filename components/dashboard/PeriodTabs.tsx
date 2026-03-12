"use client";

const PRESETS = [6, 12, 24] as const;

interface PeriodTabsProps {
  totalMonths: number;
  selected: number | null;
  onChange: (months: number | null) => void;
}

export function PeriodTabs({ totalMonths, selected, onChange }: PeriodTabsProps) {
  const tabs: { label: string; value: number | null }[] = PRESETS
    .filter((m) => totalMonths > m)
    .map((m) => ({ label: `${m}mo`, value: m }));

  tabs.push({ label: "All", value: null });

  if (tabs.length <= 1) return null;

  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1">
      {tabs.map((tab) => {
        const active =
          tab.value === selected ||
          (tab.value === null && selected === null);

        return (
          <button
            key={tab.label}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
