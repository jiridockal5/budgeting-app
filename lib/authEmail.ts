/**
 * Shared helpers for Supabase email confirmation / recovery flows.
 */

export function authCallbackUrl(nextPath: string): string {
  if (typeof window === "undefined") {
    return `/auth/callback?next=${encodeURIComponent(nextPath)}`;
  }
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}

/** True when signUp returned a user shell without creating identities (email already registered). */
export function isExistingSignupUser(user: {
  identities?: Array<unknown> | null;
} | null): boolean {
  if (!user) return false;
  return Array.isArray(user.identities) && user.identities.length === 0;
}

export function isEmailNotConfirmedError(message: string | null | undefined): boolean {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes("email not confirmed") ||
    normalized.includes("email_not_confirmed") ||
    normalized.includes("confirm your email")
  );
}

export const CONFIRMATION_EMAIL_HINT =
  "Check your inbox and spam/junk folder. If nothing arrives in a few minutes, resend the confirmation email.";
