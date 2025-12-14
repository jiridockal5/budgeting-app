import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
  TopNav,
  Hero,
  ScreenshotFrame,
  LogoRow,
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
  title: "Fundraising runway forecasts | Runway Forecast",
  description:
    "An opinionated budgeting tool for early-stage SaaS. Model revenue, hiring, and burn with simple inputs — and see runway and investor metrics instantly.",
  openGraph: {
    title: "Fundraising runway forecasts | Runway Forecast",
    description:
      "An opinionated budgeting tool for early-stage SaaS. Model revenue, hiring, and burn with simple inputs — and see runway and investor metrics instantly.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fundraising runway forecasts | Runway Forecast",
    description:
      "An opinionated budgeting tool for early-stage SaaS. Model revenue, hiring, and burn with simple inputs — and see runway and investor metrics instantly.",
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

        {/* App Screenshot */}
        <ScreenshotFrame />

        {/* Social Proof */}
        <LogoRow />

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
