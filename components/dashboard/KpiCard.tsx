interface KpiCardProps {
  label: string;
  value?: string;
  secondary?: string;
}

export function KpiCard({
  label,
  value = "—",
  secondary = "vs last month —",
}: KpiCardProps) {
  return (
    <div className="flex flex-col rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <span className="text-xs font-medium uppercase tracking-wide text-neutral-600">
        {label}
      </span>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-neutral-900">{value}</span>
      </div>
      <span className="text-xs text-neutral-600">{secondary}</span>
      <div
        className="mt-4 h-12 rounded-lg border border-dashed border-neutral-200 bg-neutral-50"
        aria-hidden="true"
      />
    </div>
  );
}

export default KpiCard;

