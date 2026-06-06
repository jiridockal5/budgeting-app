"use client";

import { Info } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton, TableRowSkeleton } from "@/components/ui/Skeleton";
import { CostAssumptionsSnapshot, NonHeadcountSection } from "../sections";
import { useExpensesController } from "../useExpensesController";

export default function NonPeopleCostsPage() {
  const controller = useExpensesController();

  if (controller.loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-200">
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
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="space-y-8">
          <PageHeader
            title="Non-People Costs"
            subtitle="Tools, infra, marketing & other costs — fixed, growing, or revenue-linked"
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

          <NonHeadcountSection
            rows={controller.nonHeadcountRows}
            form={controller.nonHeadcountForm}
            setForm={controller.setNonHeadcountForm}
            onAdd={controller.handleAddNonHeadcount}
            onEdit={controller.handleEditNonHeadcount}
            onCancelEdit={controller.handleCancelEditNonHeadcount}
            onDelete={controller.requestDeleteNonHeadcount}
            editingId={controller.editingNonHeadcountId}
            summary={controller.nonHeadcountSummary}
            assumptions={controller.assumptions}
            selectedIds={controller.selectedNonPeople}
            setSelectedIds={controller.setSelectedNonPeople}
            onBulkScale={controller.handleBulkScale}
            onBulkDelete={controller.handleBulkDeleteNonPeople}
            onBulkDuplicate={controller.handleDuplicateNonPeople}
          />

          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                <Info className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  How expense categories work
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Categorizing expenses into COS, GTM, R&D, CS, and Ops allows
                  us to compute key SaaS metrics: gross margin (revenue minus
                  COS), sales efficiency (GTM spend vs new ARR), and R&D
                  investment ratio. These metrics help investors and operators
                  benchmark performance against industry standards.
                </p>
              </div>
            </div>
          </div>

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
