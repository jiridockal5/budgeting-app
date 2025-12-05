interface ChartCardProps {
  title: string;
  description?: string;
  placeholder?: string;
}

export function ChartCard({
  title,
  description,
  placeholder = "Chart coming soon",
}: ChartCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-medium text-slate-900">{title}</h3>
        {description ? (
          <p className="text-sm text-slate-600">{description}</p>
        ) : null}
      </div>
      <div className="mt-5 flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm font-medium text-slate-500">
        {placeholder}
      </div>
    </div>
  );
}

export default ChartCard;

