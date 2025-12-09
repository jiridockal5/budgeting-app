import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

/**
 * Homepage - redirects based on authentication status
 * - Authenticated users → /app (dashboard)
 * - Unauthenticated users → /login
 */
export default async function HomePage() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      redirect("/app");
    } else {
      redirect("/login");
    }
  } catch (error) {
    // On error, redirect to login
    redirect("/login");
  }
}
