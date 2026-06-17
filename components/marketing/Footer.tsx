"use client";

import Link from "next/link";

const footerLinks = {
  product: {
    title: "Product",
    links: [
      { label: "Features", href: "#product" },
      { label: "Metrics", href: "#metrics" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  account: {
    title: "Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Get started", href: "/signup" },
      { label: "Billing", href: "/app/settings/billing" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-200 bg-neutral-900">
      <div className="mx-auto max-w-6xl px-6 py-10 md:py-12">
        <div className="grid gap-6 md:grid-cols-4">
          {/* Brand column */}
          <div className="md:col-span-1">
            <Link
              href="/"
              className="text-[15px] font-semibold text-neutral-200 transition-colors hover:text-white"
            >
              Burnlytics
            </Link>
            <p className="mt-4 text-[13px] leading-6 text-neutral-400">
              Runway and burn analytics for early-stage SaaS. Simple inputs,
              clear outputs.
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-3 gap-8 md:col-span-3">
            {Object.values(footerLinks).map((section) => (
              <div key={section.title}>
                <h3 className="text-[12px] font-semibold uppercase tracking-wider text-neutral-500">
                  {section.title}
                </h3>
                <ul className="mt-4 space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-[13px] text-neutral-400 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-neutral-800 pt-6 md:flex-row">
          <p className="text-[12px] text-neutral-500">
            © {currentYear} Burnlytics. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-[12px] text-neutral-500 transition-colors hover:text-neutral-400"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-[12px] text-neutral-500 transition-colors hover:text-neutral-400"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

