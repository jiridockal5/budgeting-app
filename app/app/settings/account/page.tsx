"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Loader2, UserCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabaseClient";

export default function AccountSettingsPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to delete account");
      }
      await supabase.auth.signOut();
      window.location.assign("/");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to delete account",
        "error"
      );
      setDeleting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="space-y-8">
          <PageHeader
            title="Account"
            subtitle="Manage your account details and data."
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                <UserCircle className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Signed in as
                </h2>
                <p className="text-sm text-slate-500">{email ?? "Loading…"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Delete account
                </h2>
                <p className="text-sm text-slate-500">
                  Permanently delete your account, all plans, forecasts and
                  billing data. Any active subscription is cancelled
                  immediately. This cannot be undone.
                </p>
              </div>
            </div>

            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                className="mt-4 rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50"
              >
                Delete my account
              </button>
            ) : (
              <div className="mt-4 space-y-3 rounded-xl border border-red-100 bg-red-50/50 p-4">
                <p className="text-sm text-slate-700">
                  Type <span className="font-semibold">DELETE</span> to confirm:
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowConfirm(false);
                      setConfirmText("");
                    }}
                    disabled={deleting}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={confirmText !== "DELETE" || deleting}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {deleting ? "Deleting…" : "Permanently delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
