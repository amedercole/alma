import type { Lead, LeadState } from "@/generated/prisma/client";

/**
 * Public-facing representation of a lead. Deliberately omits the internal
 * `resumeKey` storage pointer and instead exposes the download URL the
 * dashboard uses. Dates are ISO strings for stable JSON serialization.
 */
export interface LeadDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  state: LeadState;
  resumeFilename: string;
  resumeMimeType: string;
  resumeSize: number;
  resumeUrl: string;
  createdAt: string;
  updatedAt: string;
  reachedOutAt: string | null;
  reachedOutById: string | null;
}

export function toLeadDTO(lead: Lead): LeadDTO {
  return {
    id: lead.id,
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    state: lead.state,
    resumeFilename: lead.resumeFilename,
    resumeMimeType: lead.resumeMimeType,
    resumeSize: lead.resumeSize,
    resumeUrl: `/api/leads/${lead.id}/resume`,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
    reachedOutAt: lead.reachedOutAt ? lead.reachedOutAt.toISOString() : null,
    reachedOutById: lead.reachedOutById,
  };
}
