"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Sidebar from "@/components/layout/Sidebar";
import { AccessGate, TrialBanner } from "@/components/billing/AccessGate";

type Session = Awaited<
  ReturnType<typeof supabase.auth.getSession>
>["data"]["session"];

/**
 * App layout for authenticated routes
 * Note: Route protection is handled by middleware.ts
 * This component only handles UI state and logout functionality
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isSubscribeOnly = pathname.startsWith("/app/subscribe");
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Middleware handles redirect, but we still need session for UI
      setSession(session);
      setLoading(false);
    };

    loadSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white px-5 py-3 text-sm text-neutral-600 shadow-lg">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-turquoise-400 border-t-transparent" />
          Loading...
        </div>
      </div>
    );
  }

  const email = session?.user.email ?? "Unknown user";

  return (
    <AccessGate>
      <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
        {!isSubscribeOnly && <Sidebar />}

        <div className="flex flex-1 flex-col">
          {!isSubscribeOnly && <TrialBanner />}
          {!isSubscribeOnly && (
          <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-end gap-4 pl-14 pr-6 py-4 lg:pl-6 lg:px-8">
            <div className="hidden text-right md:block">
              <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                Signed in as
              </p>
              <p className="text-sm font-semibold text-neutral-900">{email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-sm font-medium text-neutral-900 shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50"
            >
              Logout
            </button>
          </div>
        </header>
          )}

        <div className="flex-1 overflow-y-auto bg-neutral-50">{children}</div>
      </div>
    </div>
    </AccessGate>
  );
}

