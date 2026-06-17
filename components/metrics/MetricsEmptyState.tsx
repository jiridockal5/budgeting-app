import Link from "next/link";
import { BarChart3 } from "lucide-react";

export function MetricsEmptyState() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center">
      <BarChart3 className="mx-auto h-12 w-12 text-neutral-300" />
      <h3 className="mt-4 text-lg font-semibold text-neutral-900">
        No forecast data yet
      </h3>
      <p className="mt-2 text-sm text-neutral-500 max-w-md mx-auto">
        Configure your{" "}
        <Link href="/app/revenue" className="text-turquoise-600 hover:underline">
          revenue streams
        </Link>
        ,{" "}
        <Link href="/app/expenses" className="text-turquoise-600 hover:underline">
          expenses
        </Link>
        , and{" "}
        <Link href="/app/assumptions" className="text-turquoise-600 hover:underline">
          assumptions
        </Link>{" "}
        to see projected metrics.
      </p>
    </div>
  );
}
