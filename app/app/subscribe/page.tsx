"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { SubscribeCheckout } from "@/components/billing/SubscribeCheckout";
import { useToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabaseClient";
import { TRIAL_DAYS } from "@/config/plans";

export default function SubscribePage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    if (searchParams.get("cancelled") === "true") {
      toast("Checkout cancelled", "info");
    }
  }, [searchParams, toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-16">
        <div className="mb-4 flex w-full justify-end">
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-neutral-500 hover:text-neutral-700"
          >
            Log out
          </button>
        </div>
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Subscribe to Burnlytics
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Your {TRIAL_DAYS}-day trial included full access. Choose a plan to
            continue building forecasts, running scenarios, and exporting for
            investors.
          </p>
        </div>

        <div className="w-full">
          <SubscribeCheckout locked showTrialNote={false} />
        </div>

        <p className="mt-6 text-center text-xs text-neutral-500">
          Already subscribed?{" "}
          <Link
            href="/app/settings/billing"
            className="font-medium text-turquoise-600 hover:text-turquoise-500"
          >
            Check billing status
          </Link>
        </p>
      </div>
    </main>
  );
}
