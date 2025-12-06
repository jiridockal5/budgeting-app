"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/metrics", label: "Metrics" },
  { href: "/app/revenue", label: "Revenue" },
  { href: "/app/expenses", label: "Expenses" },
  { href: "/pricing", label: "Pricing" },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Budgeting App
            </h2>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-slate-900">
              Budgeting App
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-100" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50">{children}</div>
      </div>
    </div>
  );
}

