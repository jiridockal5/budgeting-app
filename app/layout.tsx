import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Providers } from "@/components/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Burnlytics | Budget planning and cash-flow forecasts",
  description:
    "A clear budgeting app for planning income, expenses, savings goals, and cash flow with simple inputs.",
  openGraph: {
    title: "Burnlytics | Budget planning and cash-flow forecasts",
    description:
      "A clear budgeting app for planning income, expenses, savings goals, and cash flow with simple inputs.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Burnlytics | Budget planning and cash-flow forecasts",
    description:
      "A clear budgeting app for planning income, expenses, savings goals, and cash flow with simple inputs.",
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
