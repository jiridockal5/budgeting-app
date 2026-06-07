import { ReactNode } from "react";

const TURQUOISE_GLOW =
  "radial-gradient(ellipse 72% 58% at center, rgba(126, 207, 199, 0.55) 0%, rgba(168, 221, 216, 0.22) 48%, transparent 74%)";

interface TurquoiseIconBadgeProps {
  children: ReactNode;
  className?: string;
}

/** Soft turquoise oval glow behind small card icons. */
export function TurquoiseIconBadge({
  children,
  className = "",
}: TurquoiseIconBadgeProps) {
  return (
    <div
      className={`relative flex h-10 w-10 shrink-0 items-center justify-center overflow-visible rounded-xl ${className}`}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[160%] w-[160%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] blur-[14px]"
        style={{ background: TURQUOISE_GLOW }}
        aria-hidden="true"
      />
      <div className="relative z-10 flex h-full w-full items-center justify-center rounded-xl bg-white/70 text-neutral-600 ring-1 ring-white/80 backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
}

interface TurquoiseBrandGlowProps {
  children: ReactNode;
  className?: string;
}

/** Soft turquoise glow behind the Burnlytics wordmark. */
export function TurquoiseBrandGlow({
  children,
  className = "",
}: TurquoiseBrandGlowProps) {
  return (
    <span
      className={`relative inline-flex items-center ${className}`}
    >
      <span
        className="pointer-events-none absolute -inset-x-4 -inset-y-2 rounded-full blur-[18px]"
        style={{ background: TURQUOISE_GLOW }}
        aria-hidden="true"
      />
      <span className="relative z-10">{children}</span>
    </span>
  );
}
