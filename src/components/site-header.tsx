"use client";

import Link from "next/link";
import { useDemo } from "@/components/demo/demo-context";

/** App header. Nav + "restart" only appear once the visitor is in the demo. */
export function SiteHeader() {
  const { email, reset } = useDemo();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-slate-900"
          >
            alma
          </Link>
          <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
            Demo
          </span>
        </div>

        {email && (
          <nav className="flex items-center gap-4 text-sm">
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
            <button
              onClick={() => reset()}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
            >
              Restart
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
