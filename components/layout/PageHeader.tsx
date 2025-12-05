interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        {subtitle ? (
          <p className="mt-2 text-sm font-medium text-slate-600">{subtitle}</p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      ) : null}
    </div>
  );
}

export default PageHeader;

