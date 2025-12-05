"use client";

import Link from "next/link";

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
}

export function AuthCard({
  children,
  title,
  subtitle,
  footerText,
  footerLinkText,
  footerLinkHref,
}: AuthCardProps) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          B
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="text-slate-600 mt-2 text-sm">{subtitle}</p>
      </div>

      {children}

      <p className="mt-6 text-center text-sm text-slate-600">
        {footerText}{" "}
        <Link
          href={footerLinkHref}
          className="font-medium text-indigo-600 transition-colors hover:text-indigo-700"
        >
          {footerLinkText}
        </Link>
      </p>
    </div>
  );
}

