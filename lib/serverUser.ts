import { createSupabaseServerClient } from "./supabaseServer";

export type ServerUser = {
  id: string;
  email?: string | null;
  isFallback: boolean;
};

/**
 * Resolve the current Supabase user for server-side contexts.
 * Falls back to a static demo user so we can keep building while auth wiring evolves.
 */
export async function getServerUser(): Promise<ServerUser> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      return { id: user.id, email: user.email, isFallback: false };
    }
  } catch (error) {
    console.warn("getServerUser fallback path hit", error);
  }

  // Only allow demo fallback in development
  if (process.env.NODE_ENV === "development") {
    return { id: "demo-user", email: "demo@example.com", isFallback: true };
  }

  throw new Error("Authentication required");
}

