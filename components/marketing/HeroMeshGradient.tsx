"use client";

import { motion, useReducedMotion } from "framer-motion";
import { TURQUOISE } from "@/lib/turquoise";

/** Visual center of the hero glow (behind the product preview). */
const MESH_ORIGIN = "68% 52%";
const ROTATION_DURATION_S = 32;

function rgba(hex: string, a: number) {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${a})`;
}

const T = TURQUOISE;

/** Layered conic + linear ribbons with tighter blur for defined mesh edges. */
const MESH_LAYERS = [
  {
    id: "conic-core",
    className:
      "left-[68%] top-[52%] h-[min(640px,72vh)] w-[min(820px,92vw)] -translate-x-1/2 -translate-y-1/2 sm:left-[70%]",
    style: {
      background: `conic-gradient(from 225deg at 42% 48%,
        ${rgba(T[500], 0.36)} 0deg,
        ${rgba(T[400], 0.5)} 38deg,
        ${rgba(T[200], 0.26)} 82deg,
        transparent 128deg,
        ${rgba(T[300], 0.2)} 198deg,
        ${rgba(T[400], 0.32)} 258deg,
        transparent 308deg,
        ${rgba(T[500], 0.18)} 360deg)`,
      filter: "blur(30px)",
    },
  },
  {
    id: "ribbon-a",
    className:
      "left-[64%] top-[50%] h-[min(380px,44vh)] w-[min(720px,82vw)] -translate-x-1/2 -translate-y-1/2 rotate-[18deg] sm:left-[66%]",
    style: {
      background: `linear-gradient(118deg,
        transparent 6%,
        ${rgba(T[400], 0.44)} 26%,
        ${rgba(T[100], 0.3)} 40%,
        transparent 56%,
        ${rgba(T[500], 0.26)} 68%,
        transparent 90%)`,
      filter: "blur(22px)",
    },
  },
  {
    id: "ribbon-b",
    className:
      "left-[72%] top-[56%] h-[min(340px,40vh)] w-[min(680px,78vw)] -translate-x-1/2 -translate-y-1/2 -rotate-[12deg] sm:left-[74%]",
    style: {
      background: `linear-gradient(72deg,
        transparent 10%,
        ${rgba(T[300], 0.34)} 30%,
        ${rgba(T[400], 0.46)} 46%,
        transparent 64%)`,
      filter: "blur(18px)",
    },
  },
  {
    id: "highlight",
    className:
      "left-[66%] top-[46%] h-[min(280px,32vh)] w-[min(520px,58vw)] -translate-x-1/2 -translate-y-1/2 sm:left-[68%]",
    style: {
      background: `radial-gradient(ellipse 52% 36% at center,
        ${rgba(T[400], 0.52)} 0%,
        ${rgba(T[200], 0.18)} 42%,
        transparent 70%)`,
      filter: "blur(26px)",
    },
  },
  {
    id: "deep",
    className:
      "left-[70%] top-[58%] h-[min(420px,48vh)] w-[min(600px,70vw)] -translate-x-1/2 -translate-y-1/2 sm:left-[72%]",
    style: {
      background: `radial-gradient(ellipse 58% 34% at center,
        ${rgba(T[500], 0.3)} 0%,
        ${rgba(T[500], 0.08)} 48%,
        transparent 76%)`,
      filter: "blur(34px)",
    },
  },
] as const;

const GRAIN_SVG = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)" opacity="0.5"/></svg>'
)}")`;

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
      <motion.div
        className="absolute inset-0 will-change-transform"
        style={{ transformOrigin: MESH_ORIGIN }}
        initial={{ rotate: 0 }}
        animate={{ rotate: prefersReducedMotion ? 0 : 360 }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: ROTATION_DURATION_S, repeat: Infinity, ease: "linear" }
        }
      >
        {MESH_LAYERS.map((layer) => (
          <div
            key={layer.id}
            className={`absolute rounded-[50%] ${layer.className}`}
            style={layer.style}
          />
        ))}
      </motion.div>

      {/* Static grain overlay — does not rotate with the mesh */}
      <div
        className="absolute inset-0 opacity-[0.2] mix-blend-soft-light"
        style={{
          backgroundImage: GRAIN_SVG,
          backgroundSize: "180px 180px",
        }}
      />
    </div>
  );
}
