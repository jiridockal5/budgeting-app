"use client";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton, TableRowSkeleton } from "@/components/ui/Skeleton";
import { CostAssumptionsSnapshot, HeadcountSection } from "../sections";
import { useExpensesController } from "../useExpensesController";

export default function PeopleCostsPage() {
  const controller = useExpensesController();

  if (controller.loading) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-8 sm:px-6 sm:py-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-neutral-50/50 border-b border-neutral-200">
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="p-6">
              <table className="w-full">
                <tbody>
                  <TableRowSkeleton cols={6} />
                  <TableRowSkeleton cols={6} />
                  <TableRowSkeleton cols={6} />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="space-y-8">
          <PageHeader
            title="People Costs"
            subtitle="Employees, contractors & advisors — salary, taxes, growth"
          />

          {controller.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
              <span>{controller.error}</span>
              <button
                onClick={() => controller.setError(null)}
                className="text-red-500 hover:text-red-700 font-medium"
              >
                Dismiss
              </button>
            </div>
          )}

          {controller.loadWarnings && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex items-center justify-between gap-3">
              <span>Some data could not be loaded: {controller.loadWarnings}</span>
              <button
                type="button"
                onClick={() => controller.setLoadWarnings(null)}
                className="shrink-0 text-amber-700 hover:text-amber-900 font-medium"
              >
                Dismiss
              </button>
            </div>
          )}

          <CostAssumptionsSnapshot assumptions={controller.assumptions} />

          <HeadcountSection
            rows={controller.headcountRows}
            form={controller.headcountForm}
            setForm={controller.setHeadcountForm}
            onAdd={controller.handleAddHeadcount}
            onEdit={controller.handleEditHeadcount}
            onCancelEdit={controller.handleCancelEditHeadcount}
            onDelete={controller.requestDeleteHeadcount}
            editingId={controller.editingHeadcountId}
            summary={controller.headcountSummary}
            assumptions={controller.assumptions}
          />

          <ConfirmDialog
            open={controller.deleteTarget !== null}
            title={`Delete ${
              controller.deleteTarget?.type === "headcount" ? "role" : "expense"
            }?`}
            description={`Are you sure you want to delete "${controller.deleteTarget?.name}"? This action cannot be undone.`}
            confirmPending={controller.deleteBusy}
            confirmPendingLabel="Deleting…"
            onConfirm={controller.confirmDeleteTarget}
            onCancel={controller.cancelDeleteTarget}
          />
        </div>
      </div>
    </main>
  );
}
