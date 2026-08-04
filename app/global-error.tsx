'use client'

import { useEffect } from 'react'
import posthog, { isPostHogConfigured } from "@/instrumentation-client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (isPostHogConfigured) {
      posthog.captureException(error)
    }
  }, [error])

  return (
    <html lang="en">
      <body>
        <h2>Something went wrong!</h2>
        <button type="button" onClick={() => reset()}>
          Try again
        </button>
      </body>
    </html>
  )
}
