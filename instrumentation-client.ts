import posthog from "posthog-js"

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

export const isPostHogConfigured = Boolean(projectToken && host)

// Client-only init: this module can still be evaluated during SSR of
// `global-error`, which has no `window`.
if (typeof window !== "undefined") {
  if (isPostHogConfigured) {
    posthog.init(projectToken!, {
      api_host: host,
      defaults: "2026-01-30",
      capture_exceptions: true,
      tracing_headers: [window.location.hostname],
      debug: process.env.NODE_ENV === "development",
    })
  } else if (process.env.NODE_ENV === "development") {
    throw new Error(
      "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN or NEXT_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once the variables are configured",
    )
  }
}

export default posthog
