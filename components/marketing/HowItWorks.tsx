"use client";

import { Reveal, RevealGroup, RevealItem } from "./Reveal";
import { Settings2, Sparkles, Share2 } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Settings2,
    title: "Input assumptions",
    description:
      "Pricing, growth, churn, hiring plan, and expenses. Start simple — expand as you learn more.",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "Generate the forecast",
    description:
      "Revenue, burn, runway, cash balance, and scenario comparisons — all calculated instantly.",
  },
  {
    number: "03",
    icon: Share2,
    title: "Share investor-ready outputs",
    description:
      "Key SaaS metrics and a crisp narrative for your raise. Export or share anytime.",
  },
];

export function HowItWorks() {
  return (
    <section id="product" className="relative py-16 md:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="text-center">
            <p className="text-[12px] font-medium uppercase tracking-wider text-neutral-500">
              How it works
            </p>
            <h2 className="mt-3 text-[1.75rem] font-semibold tracking-tight text-neutral-900 md:text-[2rem]">
              From assumptions to investor deck
            </h2>
          </div>
        </Reveal>

        <RevealGroup className="mt-12 grid gap-8 md:mt-16 md:grid-cols-3 md:gap-6">
          {steps.map((step, index) => (
            <RevealItem key={step.number}>
              <div className="group relative">
                {/* Connector line (hidden on mobile, visible on desktop) */}
                {index < steps.length - 1 && (
                  <div className="absolute left-1/2 top-12 hidden h-px w-full bg-gradient-to-r from-neutral-200 to-transparent md:block" />
                )}

                <div className="relative rounded-2xl border border-neutral-200 bg-white p-6 transition-colors hover:border-neutral-300">
                  {/* Step number */}
                  <span className="text-[11px] font-medium text-neutral-400">
                    {step.number}
                  </span>

                  {/* Icon */}
                  <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
                    <step.icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <h3 className="mt-4 text-[15px] font-semibold text-neutral-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-6 text-neutral-600">
                    {step.description}
                  </p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

