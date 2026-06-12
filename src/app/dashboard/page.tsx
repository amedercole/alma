import type { Metadata } from "next";
import Link from "next/link";
import { LeadState } from "@/generated/prisma/client";
import { getCurrentUser, requireSessionOrRedirect } from "@/server/auth/dal";
import { listLeadsQuerySchema } from "@/server/leads/lead.schema";
import { leadService } from "@/server/leads/lead.service";
import { toLeadDTO } from "@/server/leads/lead.types";
import { LeadsTable } from "@/components/leads-table";

export const metadata: Metadata = {
  title: "Dashboard — Alma",
};

// Always render fresh data (leads change as prospects submit / attorneys act).
export const dynamic = "force-dynamic";

const FILTERS = [
  { label: "All", value: undefined, href: "/dashboard" },
  {
    label: "Pending",
    value: LeadState.PENDING,
    href: "/dashboard?state=PENDING",
  },
  {
    label: "Reached out",
    value: LeadState.REACHED_OUT,
    href: "/dashboard?state=REACHED_OUT",
  },
] as const;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  await requireSessionOrRedirect();
  const user = await getCurrentUser();

  const { state } = await searchParams;
  const parsed = listLeadsQuerySchema.safeParse({ state });
  const activeState = parsed.success ? parsed.data.state : undefined;

  const leads = (await leadService.listLeads({ state: activeState })).map(
    toLeadDTO,
  );

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Leads
        </h1>
        {user && (
          <p className="mt-1 text-sm text-slate-500">
            Signed in as {user.email}
          </p>
        )}
      </div>

      <div className="mt-6 flex gap-2">
        {FILTERS.map((filter) => {
          const isActive = activeState === filter.value;
          return (
            <Link
              key={filter.label}
              href={filter.href}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-4">
        <LeadsTable leads={leads} />
      </div>
    </div>
  );
}
