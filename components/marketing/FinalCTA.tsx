"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";
import { DotGrid, RadialGradient, NoiseTexture } from "./Textures";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-16 md:py-20 lg:py-24">
      {/* Background with textures */}
      <div className="absolute inset-0 bg-neutral-100">
        <DotGrid className="opacity-50" />
        <RadialGradient />
        <NoiseTexture />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-[1.75rem] font-semibold tracking-tight text-neutral-900 md:text-[2rem]">
              Stop guessing runway. Build a plan you can defend.
            </h2>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/signup"
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-[14px] font-medium text-white transition-colors hover:bg-neutral-800 sm:w-auto"
              >
                Get started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/pricing"
                className="flex w-full items-center justify-center rounded-full border border-neutral-300 bg-white px-6 py-3 text-[14px] font-medium text-neutral-900 transition-colors hover:bg-neutral-50 sm:w-auto"
              >
                See pricing
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

