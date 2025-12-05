"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  AuthCard,
  AuthInput,
  AuthMessage,
  AuthButton,
} from "@/components/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      router.push("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        forgotPasswordEmail,
        {
          redirectTo: "http://localhost:3001/login",
        }
      );

      if (error) {
        setError(error.message);
        setForgotPasswordLoading(false);
        return;
      }

      setMessage(
        "If an account with this email exists, we've sent you a password reset link."
      );
      setForgotPasswordLoading(false);
      setShowForgotPassword(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setForgotPasswordLoading(false);
    }
  };

  const openForgotPassword = () => {
    setForgotPasswordEmail(email);
    setShowForgotPassword(true);
    setError(null);
    setMessage(null);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-slate-900">
                Reset password
              </h2>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="text-slate-500 transition hover:text-slate-900"
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
            <p className="mt-2 text-sm text-slate-600">
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
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm hover:border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotPasswordLoading}
                  className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="mt-2 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700"
              >
                Forgot password?
              </button>
            </div>

            {error && <AuthMessage type="error" message={error} />}
            {message && <AuthMessage type="success" message={message} />}

            <div className="pt-2">
              <AuthButton
                type="submit"
                loading={loading}
                loadingText="Signing in..."
              >
                Sign in
              </AuthButton>
            </div>
          </form>
        </AuthCard>
      </div>
    </main>
  );
}
