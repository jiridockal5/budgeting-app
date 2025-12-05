interface MetricCardProps {
  title: string;
  description: string;
  value?: string;
}

export function MetricCard({
  title,
  description,
  value = "—",
}: MetricCardProps) {
  const isPlaceholder = value === "—";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300">
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
      <div className="mt-auto flex items-center gap-2">
        <span className="text-2xl font-semibold text-slate-900">{value}</span>
        {isPlaceholder ? (
          <span className="text-xs font-medium text-slate-500">
            Awaiting data
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default MetricCard;

