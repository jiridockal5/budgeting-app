/**
 * Central place for reporting server-side route failures.
 * Uses structured logs so log drains (Vercel, Datadog, etc.) stay searchable.
 *
 * Sentry: `@sentry/nextjs` does not yet declare Next 16 as a peer dependency.
 * When it does (or if you accept `npm install @sentry/nextjs --legacy-peer-deps`),
 * add Sentry.init in `instrumentation.ts` and call `Sentry.captureException` here.
 */
export function captureRouteException(routeLabel: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  console.error(
    JSON.stringify({
      level: "error",
      source: "api-route",
      route: routeLabel,
      message,
      stack,
    })
  );
}
