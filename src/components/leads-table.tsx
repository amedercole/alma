"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LeadDTO } from "@/server/leads/lead.types";

export function LeadsTable({ leads }: { leads: LeadDTO[] }) {
  if (leads.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
        No leads yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Resume</th>
            <th className="px-4 py-3">Submitted</th>
            <th className="px-4 py-3">State</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {leads.map((lead) => (
            <LeadRow key={lead.id} lead={lead} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LeadRow({ lead }: { lead: LeadDTO }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markReachedOut() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: "REACHED_OUT" }),
      });
      if (res.ok) {
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => null);
      setError(data?.error?.message ?? "Update failed");
      setSubmitting(false);
    } catch {
      setError("Network error");
      setSubmitting(false);
    }
  }

  return (
    <tr className="text-slate-700">
      <td className="px-4 py-3 font-medium text-slate-900">
        {lead.firstName} {lead.lastName}
      </td>
      <td className="px-4 py-3">{lead.email}</td>
      <td className="px-4 py-3">
        <a
          href={lead.resumeUrl}
          className="font-medium text-slate-700 underline hover:text-slate-900"
        >
          Download
        </a>
      </td>
      <td className="px-4 py-3 text-slate-500">
        {lead.createdAt.slice(0, 10)}
      </td>
      <td className="px-4 py-3">
        <StateBadge state={lead.state} />
      </td>
      <td className="px-4 py-3 text-right">
        {lead.state === "PENDING" ? (
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={markReachedOut}
              disabled={submitting}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Mark reached out"}
            </button>
            {error && <span className="text-xs text-red-600">{error}</span>}
          </div>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </td>
    </tr>
  );
}

function StateBadge({ state }: { state: LeadDTO["state"] }) {
  const styles =
    state === "REACHED_OUT"
      ? "bg-green-100 text-green-800"
      : "bg-amber-100 text-amber-800";
  const label = state === "REACHED_OUT" ? "Reached out" : "Pending";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}
    >
      {label}
    </span>
  );
}
