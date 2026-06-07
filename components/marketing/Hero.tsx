"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";
import { HeroMeshGradient } from "./HeroMeshGradient";

export function Hero() {
  return (
    <section className="relative isolate pt-20 pb-8 md:pt-24 md:pb-10 lg:pt-28 lg:pb-12">
      {/* Orbs stay inside hero; soft mask fades bottom edge on scroll */}
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        aria-hidden="true"
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.35) 18%, black 38%), linear-gradient(to bottom, black 0%, black 88%, rgba(0,0,0,0.4) 94%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.35) 18%, black 38%), linear-gradient(to bottom, black 0%, black 88%, rgba(0,0,0,0.4) 94%, transparent 100%)",
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      >
        <HeroMeshGradient />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          {/* Kicker */}
          <Reveal>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-[13px] font-medium text-neutral-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
              Runway forecasting for early-stage SaaS
            </div>
          </Reveal>

          {/* Headline */}
          <Reveal delay={0.1}>
            <h1 className="text-[2.25rem] font-semibold leading-[1.05] tracking-tight text-neutral-900 sm:text-[2.75rem] md:text-[3.25rem] lg:text-[4.5rem] lg:leading-[1.02] xl:text-[5rem]">
              Fundraising-ready
              <br />
              runway forecasts
              <br />
              in minutes.
            </h1>
          </Reveal>

          {/* Subheadline */}
          <Reveal delay={0.2}>
            <p className="mx-auto mt-5 max-w-[680px] text-[17px] leading-[1.65] text-neutral-600 md:text-[18px] md:leading-[1.7]">
              An opinionated budgeting tool for early-stage SaaS. Model revenue,
              hiring, and burn with simple inputs — and see runway and investor
              metrics instantly.
            </p>
          </Reveal>

          {/* CTAs */}
          <Reveal delay={0.3}>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-3">
              <Link
                href="/signup"
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-neutral-800 sm:w-auto"
              >
                Get started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/pricing"
                className="flex w-full items-center justify-center rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-[15px] font-medium text-neutral-900 transition-colors hover:bg-neutral-50 sm:w-auto"
              >
                See pricing
              </Link>
            </div>
          </Reveal>

          {/* Trust line */}
          <Reveal delay={0.4}>
            <p className="mt-5 text-[14px] text-neutral-600">
              No integrations. No spreadsheets. Just a clear 12–24 month plan.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
