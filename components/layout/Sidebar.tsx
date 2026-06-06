"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ChevronRight } from "lucide-react";
import { navItems } from "@/config/navItems";

function isPathActive(pathname: string, href: string) {
  if (href === "/app") {
    return pathname === "/app";
  }
  return pathname.startsWith(href);
}

function NavContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate: () => void;
}) {
  const isActive = (href: string) => isPathActive(pathname, href);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 pb-4 pt-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-sm font-semibold text-indigo-700">
          B
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Budgeting App</p>
          <p className="text-xs text-slate-500">SaaS forecasting</p>
        </div>
      </div>

      <nav className="mt-1 flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const childActive =
            item.children?.some((child) => isActive(child.href)) ?? false;
          const active = isActive(item.href) || childActive;
          const expanded = active && Boolean(item.children?.length);
          const Icon = item.icon;

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-expanded={item.children?.length ? expanded : undefined}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-indigo-500" />
                )}
                {Icon && (
                  <Icon
                    className={`h-4 w-4 ${
                      active
                        ? "text-slate-900"
                        : "text-slate-500 group-hover:text-slate-600"
                    }`}
                  />
                )}
                <span>{item.label}</span>

                {active && (
                  <ChevronRight className="ml-auto h-4 w-4 text-indigo-400" />
                )}
              </Link>

              {expanded && item.children && (
                <div className="mt-1 space-y-1">
                  {item.children.map((child) => {
                    const childIsActive = isActive(child.href);

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onNavigate}
                        aria-current={childIsActive ? "page" : undefined}
                        className={`group relative flex items-center rounded-lg py-2 pl-9 pr-3 text-sm font-medium transition ${
                          childIsActive
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        }`}
                      >
                        {childIsActive && (
                          <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-indigo-500" />
                        )}
                        <span>{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 px-4 py-4">
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Current version
          </p>
          <p className="mt-1 text-xs text-slate-500">v0.1.0 — Beta</p>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobileMenu = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[250px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        <NavContent pathname={pathname} onNavigate={closeMobileMenu} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden h-screen w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-slate-50 lg:flex">
        <NavContent pathname={pathname} onNavigate={closeMobileMenu} />
      </aside>
    </>
  );
}

export default Sidebar;

