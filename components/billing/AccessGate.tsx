"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BILLING_GATE_ENABLED, type AccessState } from "@/config/plans";

const EXEMPT_PATHS = ["/app/subscribe", "/app/settings/billing"];

interface AccessInfo {
  state: AccessState;
  hasAppAccess: boolean;
  trialDaysLeft: number | null;
}

export function AccessGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(BILLING_GATE_ENABLED);

  useEffect(() => {
    if (!BILLING_GATE_ENABLED) {
      setChecking(false);
      return;
    }

    const isExempt = EXEMPT_PATHS.some((p) => pathname.startsWith(p));
    if (isExempt) {
      setChecking(false);
      return;
    }

    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/billing/access");
        const data = await res.json();
        if (cancelled) return;

        const access = data.data as AccessInfo | undefined;
        if (access && !access.hasAppAccess) {
          router.replace("/app/subscribe");
          return;
        }
      } catch {
        // Allow through on network error; APIs will enforce
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!BILLING_GATE_ENABLED) {
    return <>{children}</>;
  }

  if (checking && !EXEMPT_PATHS.some((p) => pathname.startsWith(p))) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-turquoise-400 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}

export function TrialBanner() {
  const pathname = usePathname();
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [state, setState] = useState<AccessState | null>(null);

  useEffect(() => {
    if (!BILLING_GATE_ENABLED) return;
    if (pathname.startsWith("/app/subscribe")) return;

    fetch("/api/billing/access")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setState(data.data.state);
          setDaysLeft(data.data.trialDaysLeft);
        }
      })
      .catch(() => {});
  }, [pathname]);

  if (!BILLING_GATE_ENABLED || state !== "trial" || daysLeft === null) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm text-amber-900 lg:px-8">
      <span className="font-medium">
        {daysLeft === 0
          ? "Your trial ends today"
          : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left in your trial`}
      </span>
      {" — "}
      <Link
        href="/app/subscribe"
        className="font-semibold underline underline-offset-2 hover:text-amber-950"
      >
        Subscribe to keep access
      </Link>
    </div>
  );
}
