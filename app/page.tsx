import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
  TopNav,
  Hero,
  HowItWorks,
  FeatureBento,
  MetricsGrid,
  UseCasesTabs,
  PricingSection,
  FAQ,
  FinalCTA,
  Footer,
  DotGrid,
  RadialGradient,
} from "@/components/marketing";

export const metadata = {
  title: "Budget planning and cash-flow forecasts | Burnlytics",
  description:
    "Plan income, expenses, savings goals, and cash flow in one budgeting app with simple inputs and clear forecasts.",
  openGraph: {
    title: "Budget planning and cash-flow forecasts | Burnlytics",
    description:
      "Plan income, expenses, savings goals, and cash flow in one budgeting app with simple inputs and clear forecasts.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Budget planning and cash-flow forecasts | Burnlytics",
    description:
      "Plan income, expenses, savings goals, and cash flow in one budgeting app with simple inputs and clear forecasts.",
  },
};

async function getSession() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const session = await getSession();
  const isLoggedIn = !!session;

  return (
    <div className="relative min-h-screen bg-[#fafafa]">
      {/* Global background textures */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <DotGrid className="opacity-40" />
        <RadialGradient />
      </div>

      {/* Navigation */}
      <TopNav showAppLink={isLoggedIn} />

      {/* Main content */}
      <main className="relative">
        {/* Hero Section */}
        <Hero />

        {/* How it Works */}
        <HowItWorks />

        {/* Features Bento Grid */}
        <FeatureBento />

        {/* Metrics Grid */}
        <MetricsGrid />

        {/* Use Cases Tabs */}
        <UseCasesTabs />

        {/* Pricing */}
        <PricingSection />

        {/* FAQ */}
        <FAQ />

        {/* Final CTA */}
        <FinalCTA />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
