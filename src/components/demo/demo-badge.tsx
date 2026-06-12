"use client";

import { useDemo } from "@/components/demo/demo-context";

/**
 * Fixed bottom-right indicator showing the email the visitor is signed in as,
 * so it's always clear who the demo is acting as.
 */
export function DemoBadge() {
  const { email } = useDemo();
  if (!email) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-[80vw] rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-sm shadow-lg backdrop-blur">
      <span className="text-slate-500">Signed in as </span>
      <span className="font-medium text-slate-900">{email}</span>
    </div>
  );
}
