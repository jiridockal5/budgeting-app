const requiredVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

const requiredServerVars = ["POSTGRES_PRISMA_URL"] as const;

export function validateEnv() {
  const missing: string[] = [];

  for (const key of requiredVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (typeof window === "undefined") {
    for (const key of requiredServerVars) {
      if (!process.env[key] && !process.env.DATABASE_URL) {
        missing.push(`${key} (or DATABASE_URL)`);
      }
    }
  }

  if (missing.length > 0) {
    console.error(
      `Missing required environment variables:\n${missing.map((v) => `  - ${v}`).join("\n")}`
    );
  }

  return missing.length === 0;
}
