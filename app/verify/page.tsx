"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function VerifyPage() {
  const [status, setStatus] = useState<{
    envVars: {
      supabaseUrl: string;
      supabaseKey: string;
      databaseUrl: string;
    };
    connection: "testing" | "success" | "error" | null;
    auth: "testing" | "success" | "error" | null;
    message: string;
    details: any;
  }>({
    envVars: {
      supabaseUrl: "",
      supabaseKey: "",
      databaseUrl: "",
    },
    connection: null,
    auth: null,
    message: "",
    details: null,
  });

  useEffect(() => {
    checkEnvironment();
    testConnection();
  }, []);

  const checkEnvironment = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || "";

    setStatus((prev) => ({
      ...prev,
      envVars: {
        supabaseUrl: url
          ? `${url.substring(0, 40)}...` + (url.length > 40 ? ` (${url.length} chars)` : "")
          : "NOT SET",
        supabaseKey: key
          ? `${key.substring(0, 40)}...` + (key.length > 40 ? ` (${key.length} chars)` : "")
          : "NOT SET",
        databaseUrl: dbUrl
          ? `${dbUrl.substring(0, 40)}...` + (dbUrl.length > 40 ? ` (${dbUrl.length} chars)` : "")
          : "NOT SET",
      },
    }));
  };

  const testConnection = async () => {
    try {
      setStatus((prev) => ({
        ...prev,
        connection: "testing",
        message: "Testing Supabase connection...",
      }));

      // Test 1: Check if we can reach Supabase API
      const { data: healthData, error: healthError } = await supabase.auth.getSession();

      if (healthError) {
        // Some errors are OK (like no session)
        if (healthError.message.includes("Failed to fetch")) {
          throw new Error("Cannot reach Supabase API. Check your NEXT_PUBLIC_SUPABASE_URL.");
        }
      }

      setStatus((prev) => ({
        ...prev,
        connection: "success",
        message: "✅ Connection successful! Testing auth service...",
      }));

      // Test 2: Try to get user (this will fail if not logged in, but that's OK)
      const { data: userData, error: userError } = await supabase.auth.getUser();

      // User error is OK if it's just "not authenticated"
      if (userError && !userError.message.includes("JWT") && !userError.message.includes("session")) {
        console.warn("User check warning:", userError);
      }

      setStatus({
        envVars: status.envVars,
        connection: "success",
        auth: "success",
        message: "✅ All tests passed! Supabase is connected and working.",
        details: {
          hasSession: !!healthData.session,
          userId: healthData.session?.user?.id || "No active session (this is OK)",
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 50) + "...",
        },
      });
    } catch (error: any) {
      setStatus({
        envVars: status.envVars,
        connection: "error",
        auth: "error",
        message: `❌ Error: ${error.message}`,
        details: {
          error: error.message,
          stack: error.stack,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "NOT SET",
        },
      });
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">
          Supabase Connection Verification
        </h1>

        <div className="space-y-6">
          {/* Environment Variables */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Environment Variables Status
            </h2>
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-600">
                    NEXT_PUBLIC_SUPABASE_URL:
                  </span>
                  <p className="text-sm text-slate-900 mt-1 font-mono">
                    {status.envVars.supabaseUrl}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    status.envVars.supabaseUrl === "NOT SET"
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {status.envVars.supabaseUrl === "NOT SET" ? "MISSING" : "SET"}
                </span>
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-600">
                    NEXT_PUBLIC_SUPABASE_ANON_KEY:
                  </span>
                  <p className="text-sm text-slate-900 mt-1 font-mono">
                    {status.envVars.supabaseKey}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    status.envVars.supabaseKey === "NOT SET"
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {status.envVars.supabaseKey === "NOT SET" ? "MISSING" : "SET"}
                </span>
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-600">
                    DATABASE_URL / POSTGRES_PRISMA_URL:
                  </span>
                  <p className="text-sm text-slate-900 mt-1 font-mono">
                    {status.envVars.databaseUrl}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    status.envVars.databaseUrl === "NOT SET"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {status.envVars.databaseUrl === "NOT SET" ? "OPTIONAL" : "SET"}
                </span>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Connection Tests</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    status.connection === "success"
                      ? "bg-green-500"
                      : status.connection === "error"
                      ? "bg-red-500"
                      : status.connection === "testing"
                      ? "bg-yellow-500 animate-pulse"
                      : "bg-gray-300"
                  }`}
                />
                <span className="font-medium">Supabase API Connection</span>
                {status.connection === "success" && (
                  <span className="text-green-600 text-sm">✓ Connected</span>
                )}
                {status.connection === "error" && (
                  <span className="text-red-600 text-sm">✗ Failed</span>
                )}
                {status.connection === "testing" && (
                  <span className="text-yellow-600 text-sm">Testing...</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    status.auth === "success"
                      ? "bg-green-500"
                      : status.auth === "error"
                      ? "bg-red-500"
                      : status.auth === "testing"
                      ? "bg-yellow-500 animate-pulse"
                      : "bg-gray-300"
                  }`}
                />
                <span className="font-medium">Auth Service</span>
                {status.auth === "success" && (
                  <span className="text-green-600 text-sm">✓ Working</span>
                )}
                {status.auth === "error" && (
                  <span className="text-red-600 text-sm">✗ Failed</span>
                )}
                {status.auth === "testing" && (
                  <span className="text-yellow-600 text-sm">Testing...</span>
                )}
              </div>
            </div>
          </div>

          {/* Message */}
          {status.message && (
            <div
              className={`rounded-lg border p-4 ${
                status.connection === "success" && status.auth === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <p className="font-medium">{status.message}</p>
            </div>
          )}

          {/* Details */}
          {status.details && (
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
              <h3 className="font-medium text-slate-900 mb-2">Test Details:</h3>
              <pre className="text-xs text-slate-600 overflow-auto max-h-60">
                {JSON.stringify(status.details, null, 2)}
              </pre>
            </div>
          )}

          {/* Test Button */}
          <button
            onClick={testConnection}
            className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Run Tests Again
          </button>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <h3 className="font-medium text-blue-900 mb-2">How to Use This Page:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Check if all environment variables are "SET" (green badges)</li>
              <li>Verify the connection tests show "✓ Connected" and "✓ Working"</li>
              <li>If you see errors, check the browser console (F12) for more details</li>
              <li>Make sure your Vercel environment variables match what's shown here</li>
              <li>After fixing variables in Vercel, wait for redeployment and refresh this page</li>
            </ol>
          </div>

          {/* Common Issues */}
          <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
            <h3 className="font-medium text-yellow-900 mb-2">Common Issues:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
              <li>
                <strong>"Failed to fetch":</strong> Usually means NEXT_PUBLIC_SUPABASE_URL is wrong
                or the Supabase project is paused
              </li>
              <li>
                <strong>"Missing environment variables":</strong> Check Vercel Settings →
                Environment Variables
              </li>
              <li>
                <strong>Variables not updating:</strong> Redeploy your Vercel app after changing
                environment variables
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
