import type { ReactNode } from "react";

interface ChartShellProps {
  title: string;
  description?: string;
  children?: ReactNode;
  placeholder?: string;
  hasData?: boolean;
  chartHeightClass?: string;
}

export function ChartShell({
  title,
  description,
  children,
  placeholder = "Chart coming soon",
  hasData = true,
  chartHeightClass = "h-64",
}: ChartShellProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
        {description ? (
          <p className="text-sm text-neutral-500">{description}</p>
        ) : null}
      </div>

      {hasData ? (
        <div className={`chart-theme mt-5 w-full ${chartHeightClass}`}>{children}</div>
      ) : (
        <div className="mt-5 flex h-64 items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50 text-sm font-medium text-neutral-500">
          {placeholder}
        </div>
      )}
    </div>
  );
}
