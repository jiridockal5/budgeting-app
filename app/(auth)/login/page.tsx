"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  authCallbackUrl,
  CONFIRMATION_EMAIL_HINT,
  isEmailNotConfirmedError,
} from "@/lib/authEmail";
import {
  AuthCard,
  AuthInput,
  AuthMessage,
  AuthButton,
} from "@/components/auth";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resending, setResending] = useState(false);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/app";

  useEffect(() => {
    const callbackError = searchParams.get("error");
    if (callbackError === "auth_callback_failed") {
      setError(
        "That sign-in link could not be verified. It may have expired or already been used. Request a new confirmation or reset email and try again.",
      );
    } else if (callbackError === "config") {
      setError(
        "Authentication is not configured correctly. Please contact support.",
      );
    }
  }, [searchParams]);

  // Check Supabase configuration on mount
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      setError(
        "Supabase configuration is missing. Please check your environment variables.",
      );
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (!email || !password) {
        setError("Please enter both email and password");
        return;
      }

      setNeedsConfirmation(false);

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        let errorMessage = signInError.message;
        if (signInError.message === "Failed to fetch") {
          errorMessage =
            "Unable to connect to authentication service. Please check your internet connection and try again. If the problem persists, verify your Supabase configuration.";
        }

        if (isEmailNotConfirmedError(signInError.message)) {
          setNeedsConfirmation(true);
          errorMessage =
            "Email not confirmed yet. Resend the confirmation email, then try signing in again.";
        }

        setError(errorMessage);
        return;
      }

      if (data.session) {
        // Refresh server components, then hard-redirect outside Suspense so
        // the fresh session cookie is picked up by the middleware.
        router.refresh();
        setTimeout(() => {
          window.location.assign(redirectTo);
        }, 10);

        return;
      }

      setError("Sign in failed. Please try again.");
    } catch (err) {
      let errorMessage = "An unexpected error occurred";
      if (err instanceof Error) {
        errorMessage = err.message;
        if (err.message.includes("fetch")) {
          errorMessage =
            "Network error: Unable to connect to authentication service. Please check your Supabase URL and network connection.";
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  const handleResendConfirmation = async () => {
    if (!email.trim()) {
      setError("Enter your email address, then resend the confirmation email.");
      return;
    }
    setResending(true);
    setError(null);
    setMessage(null);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: authCallbackUrl("/app"),
        },
      });
      if (resendError) {
        setError(resendError.message);
        return;
      }
      setMessage(
        "Confirmation email sent. Check your inbox and spam folder, then sign in after confirming.",
      );
      setNeedsConfirmation(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setResending(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Send users to the auth callback, which exchanges the recovery code
      // for a session and forwards to the set-new-password page.
      const { error } = await supabase.auth.resetPasswordForEmail(
        forgotPasswordEmail,
        {
          redirectTo: authCallbackUrl("/reset-password"),
        },
      );

      if (error) {
        let errorMessage = error.message;
        if (error.message === "Failed to fetch") {
          errorMessage =
            "Unable to connect to authentication service. Please check your configuration.";
        }
        setError(errorMessage);
        setForgotPasswordLoading(false);
        return;
      }

      setMessage(
        "If an account with this email exists, we've sent you a password reset link.",
      );
      setForgotPasswordLoading(false);
      setShowForgotPassword(false);
    } catch (err) {
      let errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      if (err instanceof Error && err.message.includes("fetch")) {
        errorMessage =
          "Network error: Unable to connect to authentication service.";
      }
      setError(errorMessage);
      setForgotPasswordLoading(false);
    }
  };

  const openForgotPassword = () => {
    setForgotPasswordEmail(email);
    setShowForgotPassword(true);
    setError(null);
    setMessage(null);
  };

  // Close the reset-password overlay with Escape
  useEffect(() => {
    if (!showForgotPassword) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowForgotPassword(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showForgotPassword]);

  return (
    <main className="min-h-screen bg-neutral-50">
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-neutral-900">
                Reset password
              </h2>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="text-neutral-500 transition hover:text-neutral-900"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-sm text-neutral-600">
              Enter your email address and we&apos;ll send you a reset link.
            </p>
            <form onSubmit={handleForgotPassword} className="mt-4 space-y-4">
              <AuthInput
                id="forgot-email"
                label="Email"
                type="email"
                value={forgotPasswordEmail}
                onChange={setForgotPasswordEmail}
                placeholder="you@example.com"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 shadow-sm hover:border-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotPasswordLoading}
                  className="flex-1 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {forgotPasswordLoading ? "Sending..." : "Send link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-5xl items-center justify-center px-6 py-10">
        <AuthCard
          title="Welcome back"
          subtitle="Sign in to your account to continue"
          footerText="Don't have an account?"
          footerLinkText="Sign up"
          footerLinkHref="/signup"
        >
          <form onSubmit={handleSignIn} className="space-y-5">
            <AuthInput
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
            />

            <div>
              <AuthInput
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={openForgotPassword}
                className="mt-2 text-sm font-medium text-turquoise-600 transition-colors hover:text-turquoise-700"
              >
                Forgot password?
              </button>
            </div>

            {error && <AuthMessage type="error" message={error} />}
            {message && <AuthMessage type="success" message={message} />}
            {needsConfirmation && (
              <p className="text-sm text-neutral-600">{CONFIRMATION_EMAIL_HINT}</p>
            )}

            <div className="space-y-3 pt-2">
              <AuthButton
                type="submit"
                loading={loading}
                loadingText="Signing in..."
              >
                Sign in
              </AuthButton>
              {needsConfirmation && (
                <AuthButton
                  type="button"
                  variant="secondary"
                  loading={resending}
                  loadingText="Sending..."
                  onClick={handleResendConfirmation}
                >
                  Resend confirmation email
                </AuthButton>
              )}
            </div>
          </form>
        </AuthCard>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-neutral-50">
          <div className="mx-auto flex max-w-5xl items-center justify-center px-6 py-10">
            <div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white px-5 py-3 text-sm text-neutral-600 shadow-lg">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-turquoise-400 border-t-transparent" />
              Loading...
            </div>
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
