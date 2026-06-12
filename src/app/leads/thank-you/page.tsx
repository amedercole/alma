import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Thank you — Alma",
};

export default function ThankYouPage() {
  return (
    <div className="mx-auto max-w-xl text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">
        ✓
      </div>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
        Application received
      </h1>
      <p className="mt-2 text-slate-600">
        Thanks for applying. We&apos;ve sent a confirmation to your email, and
        an attorney will reach out to you soon.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block text-sm font-semibold text-slate-700 hover:text-slate-900"
      >
        ← Back home
      </Link>
    </div>
  );
}
