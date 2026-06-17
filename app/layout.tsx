import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@unovis/ts/styles";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Providers } from "@/components/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Burnlytics | Runway & burn forecasts for early-stage SaaS",
  description:
    "An opinionated budgeting tool for early-stage SaaS. Model revenue, hiring, and burn with simple inputs — and see runway and investor metrics instantly.",
  openGraph: {
    title: "Burnlytics | Runway & burn forecasts for early-stage SaaS",
    description:
      "An opinionated budgeting tool for early-stage SaaS. Model revenue, hiring, and burn with simple inputs — and see runway and investor metrics instantly.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Burnlytics | Runway & burn forecasts for early-stage SaaS",
    description:
      "An opinionated budgeting tool for early-stage SaaS. Model revenue, hiring, and burn with simple inputs — and see runway and investor metrics instantly.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <ErrorBoundary>{children}</ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
