/**
 * Utilities for interpreting API and runtime errors into user-friendly messages.
 */

const DB_ERROR_PATTERNS = [
  "can't reach database",
  "can not reach database",
  "cannot reach database",
  "database server",
  "connection refused",
  "connection reset",
  "connection timeout",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "pooler.supabase",
  "invalid prisma",
  "prisma.globalAssumptions",
  "prisma.plan.find",
];

const DB_FRIENDLY_MESSAGE =
  "Cannot connect to the database. If you use Supabase, check that your project is not paused (free tier projects pause after inactivity). Verify your database connection string in environment variables (POSTGRES_PRISMA_URL or DATABASE_URL).";

function isDbError(message: string): boolean {
  const lower = message.toLowerCase();
  return DB_ERROR_PATTERNS.some((p) => lower.includes(p.toLowerCase()));
}

/**
 * Returns a user-friendly error message, with special handling for database connectivity issues.
 */
export function toUserFriendlyError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (isDbError(message)) return DB_FRIENDLY_MESSAGE;
  return message || "An unexpected error occurred. Please try again.";
}

/** Alias for toUserFriendlyError (used by pages) */
export const parseApiError = toUserFriendlyError;

/** Exported for ErrorBoundary */
export const isDatabaseError = isDbError;
