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

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        router.push("/app");
        return;
      }

      if (data.user && !data.session) {
        setMessage("Check your email for the confirmation link.");
        setLoading(false);
        return;
      }

      router.push("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
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

            <div className="pt-2">
              <AuthButton
                type="submit"
                loading={loading}
                loadingText="Creating account..."
              >
                Sign up
              </AuthButton>
            </div>
          </form>
        </AuthCard>
      </div>
    </main>
  );
}
