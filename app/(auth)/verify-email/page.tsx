"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AuthCard, AuthMessage, AuthButton } from "@/components/auth";

export default function VerifyEmailPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  const handleResend = async () => {
    if (!email) {
      setError("No email address found. Please sign in again.");
      return;
    }
    setResending(true);
    setError(null);
    setMessage(null);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/app`,
        },
      });
      if (resendError) {
        setError(resendError.message);
        return;
      }
      setMessage("Confirmation email sent. Please check your inbox.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setResending(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.assign("/login");
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-5xl items-center justify-center px-6 py-10">
        <AuthCard
          title="Confirm your email"
          subtitle={
            email
              ? `We sent a confirmation link to ${email}. Click it to activate your account.`
              : "We sent you a confirmation link. Click it to activate your account."
          }
          footerText="Wrong account?"
          footerLinkText="Sign in with a different email"
          footerLinkHref="/login"
        >
          <div className="space-y-4">
            {message && <AuthMessage type="success" message={message} />}
            {error && <AuthMessage type="error" message={error} />}

            <AuthButton
              type="button"
              loading={resending}
              loadingText="Sending..."
              onClick={handleResend}
            >
              Resend confirmation email
            </AuthButton>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </AuthCard>
      </div>
    </main>
  );
}
