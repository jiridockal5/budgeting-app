"use client";

import Link from "next/link";

const footerLinks = {
  product: {
    title: "Product",
    links: [
      { label: "Features", href: "#product" },
      { label: "Metrics", href: "#metrics" },
      { label: "Pricing", href: "/pricing" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  resources: {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "Help Center", href: "#" },
      { label: "Changelog", href: "#" },
      { label: "Status", href: "#" },
    ],
  },
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-200 bg-neutral-900">
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand column */}
          <div className="md:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-white"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-xs font-bold text-neutral-900">
                R
              </span>
              Runway
            </Link>
            <p className="mt-4 text-[13px] leading-6 text-neutral-400">
              Runway forecasting for early-stage SaaS. Simple inputs, clear
              outputs.
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
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-neutral-800 pt-8 md:flex-row">
          <p className="text-[12px] text-neutral-500">
            © {currentYear} Runway Forecast. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="#"
              className="text-[12px] text-neutral-500 transition-colors hover:text-neutral-400"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
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

