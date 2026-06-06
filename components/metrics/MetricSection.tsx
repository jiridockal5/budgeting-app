import type { ReactNode } from "react";

export function MetricSection({
  title,
  icon,
  iconBg,
  children,
}: {
  title: string;
  icon: ReactNode;
  iconBg: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4 bg-slate-50/50">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}
        >
          {icon}
        </div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="divide-y divide-slate-100 px-6">{children}</div>
    </div>
  );
}

export function MetricRow({
  label,
  value,
  highlight,
  negative,
  subdued,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  negative?: boolean;
  subdued?: boolean;
}) {
  let valueClass = "text-slate-900";
  if (highlight) valueClass = "text-emerald-600";
  if (negative) valueClass = "text-rose-600";
  if (subdued) valueClass = "text-slate-500";

  return (
    <div className="flex items-center justify-between py-3">
      <span className={`text-sm ${subdued ? "text-slate-500 pl-4" : "text-slate-600"}`}>
        {label}
      </span>
      <span className={`text-sm font-semibold tabular-nums ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}

export function MetricDivider() {
  return <div className="border-t border-slate-100 my-2" />;
}
