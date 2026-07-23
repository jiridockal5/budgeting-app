"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  authCallbackUrl,
  CONFIRMATION_EMAIL_HINT,
  isExistingSignupUser,
} from "@/lib/authEmail";
import {
  AuthCard,
  AuthInput,
  AuthMessage,
  AuthButton,
} from "@/components/auth";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setAwaitingConfirmation(false);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: authCallbackUrl("/app"),
        },
      });

      if (error) {
        let errorMessage = error.message;
        if (error.message === "Failed to fetch") {
          errorMessage =
            "Unable to connect to authentication service. Please check your internet connection and try again.";
        }
        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (data.session) {
        router.push("/app");
        return;
      }

      if (data.user && !data.session) {
        if (isExistingSignupUser(data.user)) {
          setMessage(
            "An account with this email already exists. Sign in, or resend the confirmation email if you have not confirmed yet.",
          );
        } else {
          setMessage("Check your email for the confirmation link.");
        }
        setAwaitingConfirmation(true);
        setLoading(false);
        return;
      }

      router.push("/app");
    } catch (err) {
      let errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      if (err instanceof Error && err.message.includes("fetch")) {
        errorMessage =
          "Network error: Unable to connect to authentication service. Please check your Supabase configuration.";
      }
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setError("Enter the email you used to sign up, then resend.");
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
      setMessage("Confirmation email sent. Please check your inbox and spam folder.");
      setAwaitingConfirmation(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto flex max-w-5xl items-center justify-center px-6 py-10">
        <AuthCard
          title="Create an account"
          subtitle="Sign up to get started"
          footerText="Already have an account?"
          footerLinkText="Sign in"
          footerLinkHref="/login"
        >
          <form onSubmit={handleSignUp} className="space-y-5">
            <AuthInput
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
            />

            <AuthInput
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
            />

            {error && <AuthMessage type="error" message={error} />}
            {message && <AuthMessage type="success" message={message} />}
            {awaitingConfirmation && (
              <p className="text-sm text-neutral-600">{CONFIRMATION_EMAIL_HINT}</p>
            )}

            <div className="space-y-3 pt-2">
              {!awaitingConfirmation ? (
                <AuthButton
                  type="submit"
                  loading={loading}
                  loadingText="Creating account..."
                >
                  Sign up
                </AuthButton>
              ) : (
                <>
                  <AuthButton
                    type="button"
                    loading={resending}
                    loadingText="Sending..."
                    onClick={handleResend}
                  >
                    Resend confirmation email
                  </AuthButton>
                  <AuthButton
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setAwaitingConfirmation(false);
                      setMessage(null);
                      setError(null);
                    }}
                  >
                    Use a different email
                  </AuthButton>
                </>
              )}
            </div>
          </form>
        </AuthCard>
      </div>
    </main>
  );
}
