"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Reveal, RevealGroup, RevealItem } from "./Reveal";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Do you integrate with Stripe / Chargebee / accounting?",
    answer:
      "Not yet — by design. Start with simple inputs and get to clarity fast. We're focused on forecasting first, not data syncing.",
  },
  {
    question: "Is this a reporting tool?",
    answer:
      "No. It's forecasting for runway, fundraising planning, and post-raise execution. If you need BI dashboards from live data, that's not us (yet).",
  },
  {
    question: "How long does setup take?",
    answer:
      "Most teams can create a useful baseline in 10–20 minutes. Start with the basics (revenue, main costs, headcount) and refine as you go.",
  },
  {
    question: "Can I model hiring and expenses?",
    answer:
      "Yes — headcount plan plus recurring and one-time expenses. Each hire and cost shows up in your burn and runway projections immediately.",
  },
  {
    question: "Can I run multiple scenarios?",
    answer:
      "Yes. Starter includes 3 scenarios; Growth supports unlimited. Compare different growth, hiring, or pricing strategies side by side.",
  },
  {
    question: "Is my data private?",
    answer:
      "Yes. Your data is isolated per account and not shared. We don't train models on your data or share it with third parties.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="faq" className="relative py-16 md:py-20 lg:py-24">
      {/* Background */}
      <div className="absolute inset-0 bg-neutral-50/50" />

      <div className="relative mx-auto max-w-3xl px-6">
        <Reveal>
          <div className="text-center">
            <p className="text-[12px] font-medium uppercase tracking-wider text-neutral-500">
              FAQ
            </p>
            <h2 className="mt-3 text-[1.75rem] font-semibold tracking-tight text-neutral-900 md:text-[2rem]">
              Frequently asked questions
            </h2>
          </div>
        </Reveal>

        <RevealGroup className="mt-10 divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white md:mt-12">
          {faqs.map((faq, index) => (
            <RevealItem key={index}>
              <div className="group">
                <button
                  onClick={() =>
                    setOpenIndex(openIndex === index ? null : index)
                  }
                  className="flex w-full items-start justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-neutral-50"
                  aria-expanded={openIndex === index}
                >
                  <span className="text-[14px] font-medium text-neutral-900 md:text-[15px]">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`mt-0.5 h-5 w-5 shrink-0 text-neutral-400 transition-transform ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {openIndex === index && (
                    <motion.div
                      initial={prefersReducedMotion ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={prefersReducedMotion ? { height: 0, opacity: 0 } : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 text-[14px] leading-6 text-neutral-600">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

