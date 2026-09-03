"use client";

import { Reveal, RevealGroup, RevealItem } from "./Reveal";
import { Settings2, Sparkles, Share2 } from "lucide-react";
import { TurquoiseIconBadge } from "./TurquoiseGlow";

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
    <section id="product" className="relative py-8 md:py-10 lg:py-12">
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

        <RevealGroup className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((step, index) => (
            <RevealItem key={step.number}>
              <div className="relative">
                {index < steps.length - 1 && (
                  <div className="absolute left-10 top-5 hidden h-px w-[calc(100%-0.5rem)] bg-gradient-to-r from-neutral-200 to-transparent md:block" />
                )}

                <span className="relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-[12px] font-medium tabular-nums text-neutral-500">
                  {step.number}
                </span>

                <TurquoiseIconBadge className="mt-5">
                  <step.icon className="h-5 w-5" />
                </TurquoiseIconBadge>

                <h3 className="mt-4 text-[15px] font-semibold text-neutral-900">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-sm text-[14px] leading-6 text-neutral-600">
                  {step.description}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
