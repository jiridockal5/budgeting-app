import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Runway Forecast | SaaS Budgeting & Runway Planning",
  description:
    "An opinionated budgeting tool for early-stage SaaS. Model revenue, hiring, and burn with simple inputs — and see runway and investor metrics instantly.",
  openGraph: {
    title: "Runway Forecast | SaaS Budgeting & Runway Planning",
    description:
      "An opinionated budgeting tool for early-stage SaaS. Model revenue, hiring, and burn with simple inputs — and see runway and investor metrics instantly.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Runway Forecast | SaaS Budgeting & Runway Planning",
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
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
