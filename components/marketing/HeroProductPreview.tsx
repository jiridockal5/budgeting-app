const KPIS = [
  { label: "ARR", value: "€312K", hint: "+24% YoY" },
  { label: "Net burn", value: "€42K", hint: "per month" },
  { label: "Runway", value: "18 mo", hint: "at this burn" },
];

/** Static cash-remaining series for the decorative sparkline. */
const SPARK_POINTS =
  "0,8 29,12 58,17 87,22 116,27 145,34 175,42 204,49 233,57 262,65 291,73 320,80";

export function HeroProductPreview() {
  return (
    <div
      className="relative"
      aria-hidden="true"
    >
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_24px_64px_-20px_rgba(23,23,23,0.18)]">
        {/* Chrome */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-turquoise-400" />
            <span className="text-[12px] font-medium text-neutral-600">
              Base scenario
            </span>
          </div>
          <div className="inline-flex items-center rounded-lg bg-neutral-100 p-0.5">
            <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-neutral-900 shadow-sm">
              12mo
            </span>
            <span className="px-2 py-0.5 text-[11px] font-medium text-neutral-400">
              24mo
            </span>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-3 gap-2">
            {KPIS.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                  {kpi.label}
                </p>
                <p className="mt-1 text-[17px] font-semibold tabular-nums leading-none text-neutral-900">
                  {kpi.value}
                </p>
                <p className="mt-1 text-[10px] text-neutral-500">{kpi.hint}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 pb-2 pt-3">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-[11px] font-medium text-neutral-500">
                Cash remaining
              </span>
              <span className="text-[13px] font-semibold tabular-nums text-neutral-900">
                €412K
              </span>
            </div>
            <svg
              viewBox="0 0 320 88"
              className="h-[88px] w-full"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="hero-cash-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5bb5aa" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#5bb5aa" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={`M ${SPARK_POINTS} L 320,88 L 0,88 Z`}
                fill="url(#hero-cash-fill)"
              />
              <polyline
                points={SPARK_POINTS}
                fill="none"
                stroke="#5bb5aa"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
            <div className="flex justify-between text-[10px] text-neutral-400">
              <span>M1</span>
              <span>M6</span>
              <span>M12</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
