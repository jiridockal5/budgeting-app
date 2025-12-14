"use client";

import { Reveal, RevealGroup, RevealItem } from "./Reveal";

const logos = [
  { name: "Startup A" },
  { name: "Startup B" },
  { name: "Startup C" },
  { name: "Startup D" },
  { name: "Startup E" },
];

export function LogoRow() {
  return (
    <section className="relative py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="text-center text-[13px] font-medium text-neutral-500">
            Built for operators who need clarity fast
          </p>
        </Reveal>

        <RevealGroup className="mt-8 flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {logos.map((logo) => (
            <RevealItem key={logo.name}>
              <div className="flex h-8 items-center justify-center px-4">
                <div className="flex items-center gap-2 text-[14px] font-medium text-neutral-400">
                  <div className="h-6 w-6 rounded bg-neutral-200" />
                  <span>{logo.name}</span>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

