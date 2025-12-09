import { ChartCard } from "@/components/dashboard/ChartCard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PageHeader } from "@/components/layout/PageHeader";

const KPI_CONFIG = [
  { label: "ARR", value: "—" },
  { label: "Runway (months)", value: "—" },
  { label: "Burn Multiple", value: "—" },
  { label: "NRR", value: "—" },
  { label: "CAC Payback (months)", value: "—" },
];

const INVESTOR_METRICS = [
  { title: "CAC", description: "Cost to acquire one new logo." },
  {
    title: "CAC Payback",
    description: "Months of gross profit to recover CAC.",
  },
  { title: "LTV/CAC", description: "Lifetime value relative to acquisition." },
  {
    title: "NRR",
    description: "Retention including expansion and contraction.",
  },
  { title: "GRR", description: "Retention excluding expansion revenue." },
  {
    title: "ARR Growth Rate",
    description: "Recurring revenue growth (YoY or QoQ).",
  },
  {
    title: "Net New ARR Mix",
    description: "New logo vs expansion composition.",
  },
  { title: "Gross Margin", description: "Revenue minus COGS percentage." },
  { title: "Burn Multiple", description: "Cash burn vs net new ARR." },
  { title: "Rule of 40", description: "Growth rate plus profitability." },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="space-y-10">
          <PageHeader
            title="Dashboard"
            subtitle="Forecast at a glance"
            actions={
              <>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  Basic Plan
                </span>
                <button className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500">
                  Edit assumptions
                </button>
              </>
            }
          />

          <section>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {KPI_CONFIG.map((metric) => (
                <KpiCard
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                />
              ))}
            </div>
          </section>

          <section className="mt-6 space-y-4 border-t border-slate-200 pt-6">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="mt-8 text-xl font-semibold text-slate-900">
                  Forecast overview
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Plug your ARR, burn and runway models to unlock these charts.
                </p>
              </div>
              <p className="mt-2 text-xs text-slate-600 lg:mt-0 lg:text-right">
                Last synced · Waiting for data
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard
                title="ARR & New ARR over time"
                description="Track momentum across new logos and expansion revenue."
              />
              <ChartCard
                title="Burn & Runway over time"
                description="Model burn, runway and how they react to plan updates."
              />
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="mt-8 text-xl font-semibold text-slate-900">
                Investor metrics (core SaaS health)
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                These will be calculated automatically from your SaaS budget and
                assumptions.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {INVESTOR_METRICS.map((metric) => (
                <MetricCard
                  key={metric.title}
                  title={metric.title}
                  description={metric.description}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

