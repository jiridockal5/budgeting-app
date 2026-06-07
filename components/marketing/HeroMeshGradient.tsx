"use client";

import { motion, useReducedMotion } from "framer-motion";

const PRIMARY_GRADIENT =
  "radial-gradient(ellipse 72% 48% at center, rgba(126, 207, 199, 0.52) 0%, rgba(126, 207, 199, 0.18) 46%, transparent 74%)";

const STATIC_BLOBS = [
  {
    id: "deep",
    className:
      "left-[68%] top-[54%] h-[min(460px,52vh)] w-[min(680px,78vw)] -translate-x-1/2 -translate-y-1/2 sm:left-[72%]",
    gradient:
      "radial-gradient(ellipse 68% 44% at center, rgba(91, 181, 170, 0.32) 0%, rgba(91, 181, 170, 0.1) 48%, transparent 76%)",
  },
  {
    id: "light",
    className:
      "left-[58%] top-[56%] h-[min(420px,48vh)] w-[min(740px,84vw)] -translate-x-1/2 -translate-y-1/2 sm:left-[62%]",
    gradient:
      "radial-gradient(ellipse 70% 46% at center, rgba(184, 232, 228, 0.38) 0%, rgba(212, 240, 237, 0.12) 50%, transparent 78%)",
  },
];

interface HeroMeshGradientProps {
  className?: string;
}

export function HeroMeshGradient({ className = "" }: HeroMeshGradientProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      aria-hidden="true"
    >
      {/* Static depth layers */}
      {STATIC_BLOBS.map((blob) => (
        <div
          key={blob.id}
          className={`absolute rounded-[50%] blur-[64px] sm:blur-[80px] ${blob.className}`}
          style={{ background: blob.gradient }}
        />
      ))}

      {/* Main hero glow — rotates and breathes */}
      <motion.div
        className="absolute left-[62%] top-[48%] h-[min(580px,65vh)] w-[min(860px,95vw)] rounded-[50%] blur-[72px] will-change-transform sm:left-[66%] lg:left-[68%] sm:blur-[88px]"
        style={{
          background: PRIMARY_GRADIENT,
          transformOrigin: "center center",
        }}
        initial={{ x: "-50%", y: "-50%", rotate: 0, scale: 1 }}
        animate={
          prefersReducedMotion
            ? { x: "-50%", y: "-50%", rotate: 0, scale: 1 }
            : {
                x: ["-50%", "-46%", "-54%", "-48%", "-50%"],
                y: ["-50%", "-54%", "-46%", "-52%", "-50%"],
                rotate: [0, 360],
                scale: [1, 1.08, 0.96, 1.04, 1],
              }
        }
        transition={{
          x: { duration: 20, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 20, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: 20, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 26, repeat: Infinity, ease: "linear" },
        }}
      />
    </div>
  );
}
