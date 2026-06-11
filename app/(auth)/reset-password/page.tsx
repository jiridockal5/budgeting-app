"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  AuthCard,
  AuthInput,
  AuthMessage,
  AuthButton,
} from "@/components/auth";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setSessionChecked(true);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setDone(true);
      setTimeout(() => {
        window.location.assign("/app");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-5xl items-center justify-center px-6 py-10">
        <AuthCard
          title="Set a new password"
          subtitle="Choose a new password for your account"
          footerText="Remembered your password?"
          footerLinkText="Sign in"
          footerLinkHref="/login"
        >
          {!sessionChecked ? (
            <p className="text-center text-sm text-slate-500">Loading…</p>
          ) : !hasSession ? (
            <AuthMessage
              type="error"
              message="This password reset link is invalid or has expired. Please request a new one from the sign-in page."
            />
          ) : done ? (
            <AuthMessage
              type="success"
              message="Password updated. Redirecting you to the app…"
            />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <AuthInput
                id="new-password"
                label="New password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                autoFocus
              />
              <AuthInput
                id="confirm-password"
                label="Confirm new password"
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="••••••••"
              />

              {error && <AuthMessage type="error" message={error} />}

              <div className="pt-2">
                <AuthButton
                  type="submit"
                  loading={loading}
                  loadingText="Updating password..."
                >
                  Update password
                </AuthButton>
              </div>
            </form>
          )}
        </AuthCard>
      </div>
    </main>
  );
}
