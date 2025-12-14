"use client";

import { useEffect, useState, useRef, Suspense, lazy } from "react";
import { useReducedMotion } from "framer-motion";

// Lazy load Lottie component
const Lottie = lazy(() => import("lottie-react"));

interface LottiePlayerProps {
  src: string;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  fallback?: React.ReactNode;
  speed?: number;
}

export function LottiePlayer({
  src,
  className = "",
  loop = true,
  autoplay = true,
  fallback,
  speed = 0.5,
}: LottiePlayerProps) {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [error, setError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Intersection observer for lazy loading
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(element);
        }
      },
      {
        threshold: 0,
        rootMargin: "100px",
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  // Load animation data when in view
  useEffect(() => {
    if (!isInView || prefersReducedMotion) return;

    const loadAnimation = async () => {
      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error("Failed to load animation");
        const data = await response.json();
        setAnimationData(data);
      } catch {
        setError(true);
      }
    };

    loadAnimation();
  }, [src, isInView, prefersReducedMotion]);

  // Default fallback placeholder
  const defaultFallback = (
    <div className="flex h-full w-full items-center justify-center rounded-lg bg-neutral-100">
      <div className="h-8 w-8 rounded-full bg-neutral-200" />
    </div>
  );

  const renderFallback = fallback || defaultFallback;

  // Show fallback for reduced motion preference
  if (prefersReducedMotion) {
    return (
      <div ref={containerRef} className={className}>
        {renderFallback}
      </div>
    );
  }

  // Show fallback while loading or on error
  if (!isInView || error || !animationData) {
    return (
      <div ref={containerRef} className={className}>
        {renderFallback}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className}>
      <Suspense fallback={renderFallback}>
        <Lottie
          animationData={animationData}
          loop={loop}
          autoplay={autoplay}
          style={{ width: "100%", height: "100%" }}
          rendererSettings={{
            preserveAspectRatio: "xMidYMid slice",
          }}
          // @ts-expect-error - speed prop exists but types may be outdated
          speed={speed}
        />
      </Suspense>
    </div>
  );
}

// Static placeholder for when Lottie files aren't available
export function LottiePlaceholder({
  className = "",
  icon,
}: {
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-neutral-50 to-neutral-100 ${className}`}
    >
      {icon || (
        <div className="flex flex-col items-center gap-2 text-neutral-400">
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

