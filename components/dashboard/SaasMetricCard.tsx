/**
 * SaasMetricCard - A compact metric card optimized for the 2×5 dashboard grid
 *
 * Usage:
 *   <SaasMetricCard
 *     name="ARR"
 *     value="$1.2M"
 *     helper="Annual recurring revenue"
 *   />
 *
 * To plug in real data:
 *   1. Fetch metrics from your API/Prisma (e.g., in a Server Component or via SWR)
 *   2. Pass computed values to the metrics config array
 *   3. Example:
 *      const metrics = await fetchSaasMetrics(planId);
 *      <SaasMetricCard name="ARR" value={formatCurrency(metrics.arr)} ... />
 */

export interface SaasMetricCardProps {
  /** Short metric name (e.g., "ARR", "NRR") */
  name: string;
  /** Display value - can be currency, percentage, or ratio */
  value: string;
  /** One-line helper text explaining the metric */
  helper: string;
  /** Optional: indicate if value is placeholder/loading */
  isPlaceholder?: boolean;
}

export function SaasMetricCard({
  name,
  value,
  helper,
  isPlaceholder = false,
}: SaasMetricCardProps) {
  const showPlaceholder = isPlaceholder || value === "—";

  return (
    <div className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
      {/* Metric label */}
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {name}
      </span>

      {/* Large value */}
      <div className="mt-2 flex items-baseline gap-2">
        <span
          className={`text-2xl font-bold tabular-nums ${
            showPlaceholder ? "text-slate-400" : "text-slate-900"
          }`}
        >
          {value}
        </span>
        {showPlaceholder && (
          <span className="text-[10px] font-medium text-slate-400">
            awaiting data
          </span>
        )}
      </div>

      {/* Helper text */}
      <p className="mt-2 text-xs leading-relaxed text-slate-500">{helper}</p>
    </div>
  );
}

export default SaasMetricCard;

