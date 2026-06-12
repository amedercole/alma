"use client";

import { useState } from "react";
import { useDemo } from "@/components/demo/demo-context";

/**
 * The demo entry screen. The visitor enters an email and is signed in as an
 * attorney with that address; leads they submit notify this email.
 */
export function DemoStartScreen() {
  const { signIn } = useDemo();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const email = String(
      new FormData(event.currentTarget).get("email") ?? "",
    ).trim();
    if (!email) {
      setError("Please enter an email.");
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-800">
        Demo project
      </span>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
        Try the Alma lead app
      </h1>
      <p className="mt-3 text-slate-600">
        Enter an email to explore the app end to end. You&apos;ll be signed in
        as an attorney with this address, and any lead you submit will send its
        notification here. <strong>Refresh the page to start over.</strong>
      </p>

      <div className="mt-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="demo-email"
              className="block text-sm font-medium text-slate-700"
            >
              Your email
            </label>
            <input
              id="demo-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 disabled:opacity-60"
          >
            {submitting ? "Starting…" : "Enter demo"}
          </button>
        </form>
      </div>

      <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
        📩 Heads up: the attorney notification email can land in your{" "}
        <strong>spam/junk</strong> folder — check there if you don&apos;t see it
        in your inbox.
      </p>
    </div>
  );
}
