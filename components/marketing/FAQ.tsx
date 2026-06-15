"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Reveal, RevealGroup, RevealItem } from "./Reveal";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Do you integrate with banks or accounting tools?",
    answer:
      "Not yet — by design. Start with simple inputs and get to clarity fast. We're focused on budgeting and forecasting first, not data syncing.",
  },
  {
    question: "Is this an expense tracker?",
    answer:
      "It is focused on forward-looking budget planning. If you need automatic transaction imports or live categorization, that is not the core workflow yet.",
  },
  {
    question: "How long does setup take?",
    answer:
      "Most people can create a useful baseline in 10–20 minutes. Start with income, bills, main expenses, and savings goals, then refine as you go.",
  },
  {
    question: "Can I model recurring and one-time expenses?",
    answer:
      "Yes — recurring bills, flexible expenses, and one-time costs all flow into your budget and cash-flow projections immediately.",
  },
  {
    question: "Can I run multiple scenarios?",
    answer:
      "Yes. Your trial and subscription include unlimited scenarios. Compare different income, spending, or savings plans side by side.",
  },
  {
    question: "What happens after my free trial?",
    answer:
      "You get 7 days of full access when you sign up — no credit card required. After that, subscribe to keep using Burnlytics. Your data stays saved when you upgrade.",
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
    <section id="faq" className="relative py-10 md:py-12 lg:py-14">
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

        <RevealGroup className="mt-8 divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white md:mt-10">
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

