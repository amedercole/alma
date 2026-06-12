import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alma — Lead Management",
  description:
    "Submit your application and our attorneys will reach out to you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight text-slate-900"
            >
              alma
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link
                href="/leads/new"
                className="text-slate-600 hover:text-slate-900"
              >
                Submit a lead
              </Link>
              <Link
                href="/dashboard"
                className="text-slate-600 hover:text-slate-900"
              >
                Dashboard
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
