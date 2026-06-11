import Link from "next/link";
import { Footer } from "@/components/marketing";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="text-[15px] font-semibold text-neutral-900 transition-colors hover:text-neutral-600"
          >
            Burnlytics
          </Link>
          <Link
            href="/"
            className="text-sm text-neutral-500 transition-colors hover:text-neutral-900"
          >
            Back to home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">{children}</main>
      <Footer />
    </div>
  );
}
