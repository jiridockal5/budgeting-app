"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ChevronRight } from "lucide-react";
import { navItems } from "@/config/navItems";
import { TURQUOISE_GLOW } from "@/lib/turquoise";

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
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] blur-[12px]"
            style={{ background: TURQUOISE_GLOW }}
            aria-hidden="true"
          />
          <div className="relative z-10 flex h-full w-full items-center justify-center rounded-2xl bg-neutral-900 text-sm font-semibold text-white">
            B
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-900">Burnlytics</p>
          <p className="text-xs text-neutral-500">Runway & burn analytics</p>
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
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-turquoise-400" />
                )}
                {Icon && (
                  <Icon
                    className={`h-4 w-4 ${
                      active
                        ? "text-neutral-900"
                        : "text-neutral-500 group-hover:text-neutral-600"
                    }`}
                  />
                )}
                <span>{item.label}</span>

                {active && (
                  <ChevronRight className="ml-auto h-4 w-4 text-turquoise-500" />
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
                            ? "bg-white text-neutral-900 shadow-sm"
                            : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
                        }`}
                      >
                        {childIsActive && (
                          <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-turquoise-400" />
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

      <div className="border-t border-neutral-200 px-4 py-4">
        <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Current version
          </p>
          <p className="mt-1 text-xs text-neutral-500">v0.1.0 — Beta</p>
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
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 shadow-sm lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-neutral-900/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[250px] flex-col border-r border-neutral-200 bg-white transition-transform duration-200 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        <NavContent pathname={pathname} onNavigate={closeMobileMenu} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden h-screen w-64 flex-shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 lg:flex">
        <NavContent pathname={pathname} onNavigate={closeMobileMenu} />
      </aside>
    </>
  );
}

export default Sidebar;

