import Link from "next/link";
import { SaasMetricCard } from "@/components/dashboard/SaasMetricCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { PageHeader } from "@/components/layout/PageHeader";

/**
 * Type definition for SaaS metric cards
 * Used to render the main metrics grid on the Dashboard
 */
type MetricCard = {
  id: string;
  name: string;
  value: string;
  helper: string;
};

/**
 * Core SaaS metrics configuration
 *
 * To plug in real data:
 * 1. Create an API route (e.g., /api/metrics) that queries Prisma for plan data
 * 2. Calculate each metric from your revenue, expense, and customer data
 * 3. Fetch in a Server Component or use SWR/React Query on the client
 * 4. Map the fetched values into this config array
 *
 * Example server-side fetch:
 *   const metricsData = await prisma.$queryRaw`SELECT ... FROM ...`;
 *   const metrics = buildMetricsConfig(metricsData);
 */
const SAAS_METRICS: MetricCard[] = [
  {
    id: "arr",
    name: "ARR",
    value: "$1.2M",
    helper: "Annual recurring revenue. Primary growth indicator.",
  },
  {
    id: "mrr",
    name: "MRR",
    value: "$98K",
    helper: "Monthly recurring revenue. ARR ÷ 12.",
  },
  {
    id: "nrr",
    name: "NRR",
    value: "115%",
    helper: "Net revenue retention. Target > 100%, great > 120%.",
  },
  {
    id: "grr",
    name: "GRR",
    value: "92%",
    helper: "Gross revenue retention. Excludes expansion; target > 90%.",
  },
  {
    id: "cac",
    name: "CAC",
    value: "$8.5K",
    helper: "Customer acquisition cost. Lower is better.",
  },
  {
    id: "cac-payback",
    name: "CAC Payback",
    value: "14 mo",
    helper: "Months to recover CAC. Aim for < 12 months.",
  },
  {
    id: "ltv-cac",
    name: "LTV / CAC",
    value: "4.2x",
    helper: "Lifetime value ratio. Healthy range: 3x–5x.",
  },
  {
    id: "burn-multiple",
    name: "Burn Multiple",
    value: "1.8x",
    helper: "Cash burn ÷ net new ARR. Lower is more efficient.",
  },
  {
    id: "rule-of-40",
    name: "Rule of 40",
    value: "45%",
    helper: "Growth rate + profit margin. Target ≥ 40%.",
  },
  {
    id: "net-new-arr",
    name: "Net New ARR",
    value: "$420K",
    helper: "New + expansion − churn (last 12 months).",
  },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="space-y-8">
          {/* Page Header */}
          <PageHeader
            title="Dashboard"
            subtitle="Key SaaS metrics for your current plan."
            actions={
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Basic Plan
                </span>
                <Link
                  href="/app/assumptions"
                  className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Edit assumptions
                </Link>
              </div>
            }
          />

          {/* ═══════════════════════════════════════════════════════════════
              PRIMARY METRICS GRID
              Responsive: 1 col (mobile) → 2 cols (sm) → 5 cols (lg)
              Renders 10 core SaaS metrics in a 2×5 grid on large screens
          ═══════════════════════════════════════════════════════════════ */}
          <section aria-labelledby="metrics-heading">
            <h2 id="metrics-heading" className="sr-only">
              Key Performance Metrics
            </h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {SAAS_METRICS.map((metric) => (
                <SaasMetricCard
                  key={metric.id}
                  name={metric.name}
                  value={metric.value}
                  helper={metric.helper}
                />
              ))}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECONDARY CONTENT (below the fold)
              Compressed info callout + forecast charts
          ═══════════════════════════════════════════════════════════════ */}
          <section className="space-y-6 border-t border-slate-200 pt-6">
            {/* Compressed info callout */}
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                <svg
                  className="h-4 w-4 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">
                  Connect your data to see real metrics
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  The values above are placeholders. Configure your revenue
                  streams and expenses in the Plan section to populate these
                  metrics automatically.
                </p>
              </div>
              <span className="flex-shrink-0 text-[10px] font-medium text-slate-400">
                Last synced · Waiting for data
              </span>
            </div>

            {/* Forecast overview header */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Forecast Overview
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Visual trends for ARR growth and cash runway.
              </p>
            </div>

            {/* Charts grid */}
            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard
                title="ARR & Net New ARR"
                description="Track momentum across new logos and expansion revenue."
              />
              <ChartCard
                title="Burn & Runway"
                description="Model burn rate, runway, and sensitivity to plan changes."
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
