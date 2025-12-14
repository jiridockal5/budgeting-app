"use client";

interface TextureProps {
  className?: string;
}

// Subtle dot grid pattern
export function DotGrid({ className = "" }: TextureProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.04) 1px, transparent 0)`,
        backgroundSize: "24px 24px",
      }}
      aria-hidden="true"
    />
  );
}

// Subtle line grid pattern
export function LineGrid({ className = "" }: TextureProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(0, 0, 0, 0.02) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0, 0, 0, 0.02) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
      }}
      aria-hidden="true"
    />
  );
}

// Radial gradient overlay
export function RadialGradient({ className = "" }: TextureProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        background: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 120, 120, 0.06), transparent)`,
      }}
      aria-hidden="true"
    />
  );
}

// Noise texture overlay
export function NoiseTexture({ className = "" }: TextureProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 opacity-[0.015] ${className}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }}
      aria-hidden="true"
    />
  );
}

// Combined texture background for sections
export function SectionTexture({
  className = "",
  variant = "default",
}: TextureProps & { variant?: "default" | "dark" | "accent" }) {
  const bgColors = {
    default: "bg-neutral-50/50",
    dark: "bg-neutral-900",
    accent: "bg-neutral-100/80",
  };

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <div className={`absolute inset-0 ${bgColors[variant]}`} />
      <DotGrid />
      <RadialGradient />
      <NoiseTexture />
    </div>
  );
}

// Gradient border effect
export function GradientBorder({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-neutral-200 to-neutral-300 opacity-50" />
      <div className="relative rounded-2xl bg-white">{children}</div>
    </div>
  );
}

// Soft glow effect for cards
export function CardGlow({ className = "" }: TextureProps) {
  return (
    <div
      className={`pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${className}`}
      style={{
        background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(120, 120, 120, 0.06), transparent 40%)`,
      }}
      aria-hidden="true"
    />
  );
}

